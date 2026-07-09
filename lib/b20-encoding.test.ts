import { describe, it, expect } from "vitest";
import { decodeAbiParameters, decodeFunctionData, keccak256, toHex } from "viem";
import {
  encodeAssetCreateParams,
  encodeStablecoinCreateParams,
  encodeGrantRoleCall,
  encodeUpdateSupplyCapCall,
  encodeMintCall,
  buildInitCalls,
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

  it("produces calldata that decodes back to the exact mint call", () => {
    const encoded = encodeMintCall(ADMIN, 500_000n);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: encoded });
    expect(decoded.functionName).toBe("mint");
    expect((decoded.args?.[0] as string).toLowerCase()).toBe(ADMIN);
    expect(decoded.args?.[1]).toBe(500_000n);
  });
});

describe("buildInitCalls", () => {
  it("does not grant DEFAULT_ADMIN_ROLE for an 'owner' entry matching initialAdmin — that's already assigned via initialAdmin", () => {
    const calls = buildInitCalls({
      roles: [{ role: "owner", address: ADMIN }],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
    });
    expect(calls).toHaveLength(0);
  });

  it("regression: does not grant DEFAULT_ADMIN_ROLE for an 'admin' entry that equals initialAdmin either — this exact redundant call caused a real failed deploy on Base Sepolia", () => {
    const calls = buildInitCalls({
      roles: [{ role: "admin", address: ADMIN }], // same address as initialAdmin
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
    });
    expect(calls).toHaveLength(0);
  });

  it("grants DEFAULT_ADMIN_ROLE for an 'admin' entry that is genuinely a different address", () => {
    const calls = buildInitCalls({
      roles: [{ role: "admin", address: MINTER }],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
    });
    expect(calls).toHaveLength(1);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    expect(decoded.functionName).toBe("grantRole");
    expect(decoded.args?.[0]).toBe(B20_ROLE.DEFAULT_ADMIN_ROLE);
  });

  it("skips a 'transfer' role entry entirely — not a real B20 role", () => {
    const calls = buildInitCalls({
      roles: [{ role: "transfer", address: MINTER }],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
    });
    expect(calls).toHaveLength(0);
  });

  it("maps 'freeze' to BURN_BLOCKED_ROLE, not a nonexistent freeze role", () => {
    const calls = buildInitCalls({
      roles: [{ role: "freeze", address: MINTER }],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
    });
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    expect(decoded.args?.[0]).toBe(B20_ROLE.BURN_BLOCKED_ROLE);
  });

  it("regression: mints the initial supply to initialAdmin — this was completely missing before, so every deployed token had zero supply", () => {
    const calls = buildInitCalls({
      roles: [],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "1000000000000000000000",
      maximumSupply: undefined,
    });
    expect(calls).toHaveLength(1);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    expect(decoded.functionName).toBe("mint");
    expect((decoded.args?.[0] as string).toLowerCase()).toBe(ADMIN);
    expect(decoded.args?.[1]).toBe(1000000000000000000000n);
  });

  it("does not emit a mint call when initial supply is zero", () => {
    const calls = buildInitCalls({
      roles: [],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
    });
    expect(calls).toHaveLength(0);
  });

  it("appends an updateSupplyCap call when a maximum supply is set", () => {
    const calls = buildInitCalls({
      roles: [],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: "5000000",
    });
    expect(calls).toHaveLength(1);
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    expect(decoded.functionName).toBe("updateSupplyCap");
    expect(decoded.args?.[0]).toBe(5_000_000n);
  });

  it("orders mint before updateSupplyCap — a cap set before minting could revert if it ends up below the resulting supply", () => {
    const calls = buildInitCalls({
      roles: [],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "1000",
      maximumSupply: "1000",
    });
    expect(calls).toHaveLength(2);
    expect(decodeFunctionData({ abi: b20TokenAbi, data: calls[0] }).functionName).toBe(
      "mint"
    );
    expect(decodeFunctionData({ abi: b20TokenAbi, data: calls[1] }).functionName).toBe(
      "updateSupplyCap"
    );
  });

  it("regression: grants PAUSE_ROLE and UNPAUSE_ROLE to initialAdmin when pausable is set — previously this flag was stored in the DB and shown on the dashboard but never granted on-chain, so a 'pausable' token had nobody who could actually call pause()", () => {
    const calls = buildInitCalls({
      roles: [],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
      pausable: true,
    });
    expect(calls).toHaveLength(2);
    const decodedRoles = calls.map(
      (c) => decodeFunctionData({ abi: b20TokenAbi, data: c }).args?.[0]
    );
    expect(decodedRoles).toContain(B20_ROLE.PAUSE_ROLE);
    expect(decodedRoles).toContain(B20_ROLE.UNPAUSE_ROLE);
  });

  it("regression: grants MINT_ROLE / BURN_ROLE to initialAdmin when mintable / burnable are set", () => {
    const calls = buildInitCalls({
      roles: [],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
      mintable: true,
      burnable: true,
    });
    expect(calls).toHaveLength(2);
    const decoded = calls.map((c) =>
      decodeFunctionData({ abi: b20TokenAbi, data: c })
    );
    expect(decoded.every((d) => d.functionName === "grantRole")).toBe(true);
    const grantedRoles = decoded.map((d) => d.args?.[0]);
    expect(grantedRoles).toContain(B20_ROLE.MINT_ROLE);
    expect(grantedRoles).toContain(B20_ROLE.BURN_ROLE);
  });

  it("does not double-grant MINT_ROLE when an explicit 'mint' role assignment already covers initialAdmin", () => {
    const calls = buildInitCalls({
      roles: [{ role: "mint", address: ADMIN }],
      initialAdmin: ADMIN,
      decimals: 0,
      initialSupply: "0",
      maximumSupply: undefined,
      mintable: true,
    });
    const mintRoleGrants = calls.filter((c) => {
      const decoded = decodeFunctionData({ abi: b20TokenAbi, data: c });
      return (
        decoded.functionName === "grantRole" &&
        decoded.args?.[0] === B20_ROLE.MINT_ROLE
      );
    });
    expect(mintRoleGrants).toHaveLength(1);
  });

  it("regression: scales initialSupply / maximumSupply by decimals — StepSupply.tsx's field says 'Whole units, no decimal point', but this was passing the typed value straight into BigInt() with no scaling. Typing '10000000' (ten million tokens) at 18 decimals actually minted 0.00000000000001 tokens on-chain — this is the exact bug traced from a real failed mainnet deploy.", () => {
    const calls = buildInitCalls({
      roles: [],
      initialAdmin: ADMIN,
      initialSupply: "10000000",
      maximumSupply: "1000000000",
      decimals: 18,
    });
    expect(calls).toHaveLength(2);
    const mint = decodeFunctionData({ abi: b20TokenAbi, data: calls[0] });
    const cap = decodeFunctionData({ abi: b20TokenAbi, data: calls[1] });
    expect(mint.functionName).toBe("mint");
    expect(mint.args?.[1]).toBe(10_000_000n * 10n ** 18n);
    expect(cap.functionName).toBe("updateSupplyCap");
    expect(cap.args?.[0]).toBe(1_000_000_000n * 10n ** 18n);
  });
});

