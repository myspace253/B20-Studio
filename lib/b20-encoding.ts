import { encodeAbiParameters, encodeFunctionData, isAddress } from "viem";
import { b20TokenAbi, B20_ROLE } from "@/contracts/b20";
import type { TokenRoleAssignment } from "@/types/token";

/**
 * Mirrors B20FactoryLib.encodeAssetCreateParams(name, symbol, admin, decimals).
 * Solidity's abi.encode(struct) is byte-identical to encoding a tuple of its
 * fields in declared order, so this reproduces IB20Factory.B20AssetCreateParams
 * { uint8 version; string name; string symbol; address initialAdmin; uint8 decimals; }
 * exactly, without needing the Solidity library itself.
 */
export function encodeAssetCreateParams(
  name: string,
  symbol: string,
  initialAdmin: `0x${string}`,
  decimals: number
): `0x${string}` {
  return encodeAbiParameters(
    [
      { type: "uint8" }, // version — 1 is the only encoding version published so far
      { type: "string" },
      { type: "string" },
      { type: "address" },
      { type: "uint8" },
    ],
    [1, name, symbol, initialAdmin, decimals]
  );
}

/** Mirrors B20FactoryLib.encodeStablecoinCreateParams(name, symbol, admin, currency). */
export function encodeStablecoinCreateParams(
  name: string,
  symbol: string,
  initialAdmin: `0x${string}`,
  currency: string
): `0x${string}` {
  return encodeAbiParameters(
    [
      { type: "uint8" },
      { type: "string" },
      { type: "string" },
      { type: "address" },
      { type: "string" },
    ],
    [1, name, symbol, initialAdmin, currency]
  );
}

/**
 * initCalls are raw calldata dispatched on the new token during the creation
 * bootstrap window (IB20Factory.createB20 docs). Each entry here is just
 * ordinary encodeFunctionData against the token's own ABI — identical bytes
 * to what B20FactoryLib.encodeGrantRole / encodeUpdateSupplyCap produce,
 * since both ultimately call abi.encodeWithSelector against the same
 * IB20.grantRole / IB20.updateSupplyCap selectors.
 */
export function encodeGrantRoleCall(
  role: `0x${string}`,
  account: `0x${string}`
): `0x${string}` {
  return encodeFunctionData({
    abi: b20TokenAbi,
    functionName: "grantRole",
    args: [role, account],
  });
}

export function encodeUpdateSupplyCapCall(cap: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: b20TokenAbi,
    functionName: "updateSupplyCap",
    args: [cap],
  });
}

/**
 * Maps this app's wizard role types onto real B20 roles. Not a 1:1 mapping —
 * B20 doesn't have separate "owner" vs "admin" roles (both collapse to
 * DEFAULT_ADMIN_ROLE), and "transfer" isn't a role at all in B20 — transfer
 * restriction is a PolicyRegistry assignment (updatePolicy), which isn't
 * wired here yet. Roles typed "transfer" are silently skipped rather than
 * encoded as something that doesn't exist on-chain.
 */
export function buildInitCallsFromRoles(
  roles: TokenRoleAssignment[],
  maximumSupply: string | undefined
): `0x${string}`[] {
  const calls: `0x${string}`[] = [];

  for (const { role, address } of roles) {
    if (!isAddress(address)) continue;

    switch (role) {
      case "owner":
      case "admin":
        calls.push(encodeGrantRoleCall(B20_ROLE.DEFAULT_ADMIN_ROLE, address));
        break;
      case "mint":
        calls.push(encodeGrantRoleCall(B20_ROLE.MINT_ROLE, address));
        break;
      case "burn":
        calls.push(encodeGrantRoleCall(B20_ROLE.BURN_ROLE, address));
        break;
      case "freeze":
        // Real B20 equivalent of "freeze" is burnBlocked, gated by
        // BURN_BLOCKED_ROLE — see components/dashboard/FreezeManager.tsx
        // for the PolicyRegistry piece this still doesn't cover.
        calls.push(encodeGrantRoleCall(B20_ROLE.BURN_BLOCKED_ROLE, address));
        break;
      case "transfer":
        // No-op: transfer gating is a PolicyRegistry policy assignment,
        // not a role. Nothing to encode here yet.
        break;
    }
  }

  if (maximumSupply) {
    calls.push(encodeUpdateSupplyCapCall(BigInt(maximumSupply)));
  }

  return calls;
}
