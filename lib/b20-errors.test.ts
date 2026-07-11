import { describe, it, expect, vi } from "vitest";
import { encodeErrorResult, type PublicClient } from "viem";
import { b20ErrorsAbi } from "@/contracts/b20";
import { decodeRevertReason, simulateB20Call } from "./b20-errors";

const TO = "0xB20f000000000000000000000000000000000000" as const;
const FROM = "0x1111111111111111111111111111111111111111" as const;
const DATA = "0x62975e6a" as const;

/** Builds a fake viem PublicClient whose `call` rejects with an error carrying the given revert data nested under `.cause.data`, matching viem's real error shape. */
function clientThatReverts(revertData: `0x${string}` | undefined): PublicClient {
  const call = vi.fn().mockRejectedValue(
    revertData
      ? { message: "execution reverted", cause: { data: revertData } }
      : new Error("execution reverted")
  );
  return { call } as unknown as PublicClient;
}

describe("simulateB20Call", () => {
  it("returns null when the call would succeed", async () => {
    const client = { call: vi.fn().mockResolvedValue({ data: "0x" }) } as unknown as PublicClient;
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result).toBeNull();
  });

  it("decodes a known named error into its friendly message", async () => {
    const revertData = encodeErrorResult({
      abi: b20ErrorsAbi,
      errorName: "TokenAlreadyExists",
      args: [TO],
    });
    const client = clientThatReverts(revertData);
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result).toContain("already exists");
  });

  it("decodes FeatureNotActivated into its friendly message", async () => {
    const revertData = encodeErrorResult({
      abi: b20ErrorsAbi,
      errorName: "FeatureNotActivated",
      args: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
    });
    const client = clientThatReverts(revertData);
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result).toContain("isn't activated");
  });

  it("falls back to the raw selector for an unrecognized error", async () => {
    // A selector that isn't in b20ErrorsAbi at all.
    const client = clientThatReverts("0xdeadbeef");
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result).toContain("0xdeadbeef");
    expect(result).toContain("unrecognized");
  });

  it("falls back to a generic message when the RPC gives no revert data at all", async () => {
    const client = clientThatReverts(undefined);
    const result = await simulateB20Call(client, { to: TO, data: DATA, from: FROM });
    expect(result).toMatch(/revert/i);
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
