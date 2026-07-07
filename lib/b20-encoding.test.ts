import { describe, it, expect } from "vitest";
import { decodeAbiParameters, decodeFunctionData, keccak256, toHex } from "viem";
import {
  encodeAssetCreateParams,
  encodeStablecoinCreateParams,
  encodeGrantRoleCall,
  encodeUpdateSupplyCapCall,
  buildInitCallsFromRoles,
} from "./b20-encoding";
import { B20_ROLE, b20TokenAbi } from "@/contracts/b20";

const ADMIN = "0x1111111111111111111111111111111111111111" as const;
const MINTER = "0x2222222222222222222222222222222222222222" as const;

describe("encodeAssetCreateParams", () => {
  it("round-trips to the exact B20AssetCreateParams field order", () => {
    const encoded = encodeAssetCreateParams("My Token", "MYT", ADMIN, 18);
    const [version, name, symbol, initialAdmin, decimals] = decodeAbiParameters(
      [
        { type: "uint8" },
        { type: "string" },
        { type: "string" },
        { type: "address" },
        { type: "uint8" },
      ],
      encoded
    );
    expect(version).toBe(1);
    expect(name).toBe("My Token");
    expect(symbol).toBe("MYT");
    expect(initialAdmin.toLowerCase()).toBe(ADMIN);
    expect(decimals).toBe(18);
  });
});

describe("encodeStablecoinCreateParams", () => {
  it("round-trips to the exact B20StablecoinCreateParams field order", () => {
    const encoded = encodeStablecoinCreateParams("US Dollar Token", "USDX", ADMIN, "USD");
    const [version, name, symbol, initialAdmin, currency] = decodeAbiParameters(
      [
        { type: "uint8" },
        { type: "string" },
        { type: "string" },
        { type: "address" },
        { type: "string" },
      ],
      encoded
    );
    expect(version).toBe(1);
    expect(name).toBe("US Dollar Token");
    expect(symbol).toBe("USDX");
    expect(initialAdmin.toLowerCase()).toBe(ADMIN);
    expect(currency).toBe("USD");
  });
});

describe("role constants", () => {
  it("DEFAULT_ADMIN_ROLE is bytes32(0)", () => {
    expect(B20_ROLE.DEFAULT_ADMIN_ROLE).toBe(
      `0x${"0".repeat(64)}`
    );
  });

  it("MINT_ROLE matches keccak256(\"MINT_ROLE\") exactly, per B20Constants.sol", () => {
    expect(B20_ROLE.MINT_ROLE).toBe(keccak256(toHex("MINT_ROLE")));
  });

  it("BURN_BLOCKED_ROLE matches keccak256(\"BURN_BLOCKED_ROLE\")", () => {
    expect(B20_ROLE.BURN_BLOCKED_ROLE).toBe(keccak256(toHex("BURN_BLOCKED_ROLE")));
  });
});

describe("encodeGrantRoleCall / encodeUpdateSupplyCapCall", () => {
  it("produces calldata that decodes back to the exact grantRole call", () => {
    const encoded = encodeGrantRoleCall(B20_ROLE.MINT_ROLE, MINTER);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: encoded });
    expect(decoded.functionName).toBe("grantRole");
    expect(decoded.args?.[0]).toBe(B20_ROLE.MINT_ROLE);
    expect((decoded.args?.[1] as string).toLowerCase()).toBe(MINTER);
  });

  it("produces calldata that decodes back to the exact updateSupplyCap call", () => {
    const encoded = encodeUpdateSupplyCapCall(1_000_000n);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: encoded });
    expect(decoded.functionName).toBe("updateSupplyCap");
    expect(decoded.args?.[0]).toBe(1_000_000n);
  });
});

describe("buildInitCallsFromRoles", () => {
  it("does not grant DEFAULT_ADMIN_ROLE for an 'owner' entry — that's handled via initialAdmin instead", () => {
    const calls = buildInitCallsFromRoles(
      [{ role: "owner", address: ADMIN }],
      undefined
    );
    expect(calls).toHaveLength(0);
  });

  it("grants DEFAULT_ADMIN_ROLE for an 'admin' entry as an additional co-admin", () => {
    const calls = buildInitCallsFromRoles(
      [{ role: "admin", address: MINTER }],
      undefined
    );
    expect(calls).toHaveLength(1);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    expect(decoded.functionName).toBe("grantRole");
    expect(decoded.args?.[0]).toBe(B20_ROLE.DEFAULT_ADMIN_ROLE);
  });

  it("skips a 'transfer' role entry entirely — not a real B20 role", () => {
    const calls = buildInitCallsFromRoles(
      [{ role: "transfer", address: MINTER }],
      undefined
    );
    expect(calls).toHaveLength(0);
  });

  it("maps 'freeze' to BURN_BLOCKED_ROLE, not a nonexistent freeze role", () => {
    const calls = buildInitCallsFromRoles(
      [{ role: "freeze", address: MINTER }],
      undefined
    );
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    expect(decoded.args?.[0]).toBe(B20_ROLE.BURN_BLOCKED_ROLE);
  });

  it("appends an updateSupplyCap call when a maximum supply is set", () => {
    const calls = buildInitCallsFromRoles([], "5000000");
    expect(calls).toHaveLength(1);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    expect(decoded.functionName).toBe("updateSupplyCap");
    expect(decoded.args?.[0]).toBe(5_000_000n);
  });
});
