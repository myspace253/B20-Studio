import { describe, it, expect, vi } from "vitest";
import {
  encodeErrorResult,
  BaseError,
  RawContractError,
  type PublicClient,
} from "viem";
import { b20ErrorsAbi } from "@/contracts/b20";
import { decodeRevertReason, simulateB20Call } from "./b20-errors";

const TO = "0xB20f000000000000000000000000000000000000" as const;
const FROM = "0x1111111111111111111111111111111111111111" as const;
const DATA = "0x62975e6a" as const;

/**
 * Builds a fake viem PublicClient whose `call` rejects with a real
 * RawContractError wrapped in a BaseError cause chain, matching what
 * viem's actual .call() throws on a genuine revert (see
 * viem/actions/public/call.js). A plain object with a `.data` field is
 * NOT enough — extractRevertData deliberately requires the real class,
 * since a looser check was the exact bug this test suite exists to catch
 * (see the comment on extractRevertData).
 */
function clientThatReverts(revertData: `0x${string}` | undefined): PublicClient {
  const rawError = revertData
    ? new RawContractError({ data: revertData })
    : new Error("execution reverted");
  const wrapped = new BaseError("execution reverted", { cause: rawError });
  const call = vi.fn().mockRejectedValue(wrapped);
  return { call } as unknown as PublicClient;
}

describe("simulateB20Call", () => {
  it("returns null when the call would succeed", async () => {
    const client = { call: vi.fn().mockResolvedValue({ data: "0x" }) } as unknown as PublicClient;
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result).toBeNull();
  });

  it("passes an explicit generous gas limit, so a restrictive RPC default can't masquerade as a revert", async () => {
    const call = vi.fn().mockResolvedValue({ data: "0x" });
    const client = { call } as unknown as PublicClient;
    await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(call).toHaveBeenCalledWith(
      expect.objectContaining({ gas: expect.any(BigInt) })
    );
  });

  it("blocks (with a friendly message) when a known named error is decoded", async () => {
    const revertData = encodeErrorResult({
      abi: b20ErrorsAbi,
      errorName: "TokenAlreadyExists",
      args: [TO],
    });
    const client = clientThatReverts(revertData);
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result?.blocking).toBe(true);
    expect(result?.message).toContain("already exists");
  });

  it("blocks on FeatureNotActivated with a friendly message", async () => {
    const revertData = encodeErrorResult({
      abi: b20ErrorsAbi,
      errorName: "FeatureNotActivated",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
    });
    const client = clientThatReverts(revertData);
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result?.blocking).toBe(true);
    expect(result?.message).toContain("isn't activated");
  });

  it("blocks with the raw selector for an unrecognized-but-decoded error", async () => {
    // A selector that isn't in b20ErrorsAbi at all.
    const client = clientThatReverts("0xdeadbeef");
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result?.blocking).toBe(true);
    expect(result?.message).toContain("0xdeadbeef");
    expect(result?.message).toContain("unrecognized");
  });

  it("does NOT block when the RPC gives no revert data at all — inconclusive, not confirmed", async () => {
    // Regression for the real incident this describes: a public RPC
    // endpoint returned "execution reverted" with zero revert data for a
    // call that would likely have succeeded as a real transaction. A
    // hard block here would make this pre-send check itself capable of
    // preventing valid deploys.
    const client = clientThatReverts(undefined);
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result?.blocking).toBe(false);
    expect(result?.message).toMatch(/couldn't confirm/i);
  });

  it("regression: never mistakes the original request's own calldata for revert data", async () => {
    // Mirrors the real incident: some intermediate error object exposes
    // a `.data` field that happens to equal the call's own calldata
    // (e.g. echoed request metadata), NOT actual revert output. Even
    // when this is wrapped as if it were the "real" error data, it must
    // be rejected rather than misreported as a revert selector — and
    // since that makes it an inconclusive result, it must not block.
    const misattributed = new RawContractError({ data: DATA });
    const wrapped = new BaseError("execution reverted", { cause: misattributed });
    const client = { call: vi.fn().mockRejectedValue(wrapped) } as unknown as PublicClient;
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result?.blocking).toBe(false);
    // Must NOT report DATA's selector back as if it were a revert reason.
    expect(result?.message).not.toContain(DATA.slice(0, 10));
  });
});

describe("decodeRevertReason", () => {
  it("reports a likely race condition if the replayed call actually succeeds", async () => {
    const client = { call: vi.fn().mockResolvedValue({ data: "0x" }) } as unknown as PublicClient;
    const result = await decodeRevertReason(client, {
      to: TO,
      data: DATA,
      from: FROM,
      blockNumber: 100n,
    });
    expect(result).toMatch(/race/i);
  });

  it("decodes a known named error into its friendly message", async () => {
    const revertData = encodeErrorResult({
      abi: b20ErrorsAbi,
      errorName: "LastAdminCannotRenounce",
      args: [],
    });
    const client = clientThatReverts(revertData);
    const result = await decodeRevertReason(client, {
      to: TO,
      data: DATA,
      from: FROM,
      blockNumber: 100n,
    });
    expect(result).toContain("renounceLastAdmin");
  });
});
