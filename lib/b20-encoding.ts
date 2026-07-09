import {
  encodeAbiParameters,
  encodeFunctionData,
  isAddress,
  parseUnits,
} from "viem";
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
 * B20's create params (B20AssetCreateParams / B20StablecoinCreateParams)
 * have no initial-supply field — createB20 only sets metadata and admin.
 * Without an explicit mint() during the bootstrap window, a "successful"
 * deploy would leave the token at zero supply. This was missing entirely
 * before; every deployed token so far has zero balance anywhere.
 */
export function encodeMintCall(
  to: `0x${string}`,
  amount: bigint
): `0x${string}` {
  return encodeFunctionData({
    abi: b20TokenAbi,
    functionName: "mint",
    args: [to, amount],
  });
}

/**
 * Order matters here: mint (establishing totalSupply) happens before
 * updateSupplyCap, since a cap set below an existing supply would revert.
 * The wizard's own validation already guarantees maximumSupply >=
 * initialSupply, so this ordering is always safe given valid input.
 *
 * mintable / burnable / pausable mirror the wizard's Supply-step
 * capability toggles (types/token.ts TokenSupplyConfig). Per B20's Roles
 * Model, mint is gated by MINT_ROLE, burn by BURN_ROLE, and pause/unpause
 * by separate PAUSE_ROLE / UNPAUSE_ROLE grants — none of these are
 * implied by anything else in the create params, so a token deployed
 * with pausable: true but no PAUSE_ROLE holder is not actually pausable
 * on-chain, regardless of what the dashboard displays. These flags grant
 * the corresponding role(s) to initialAdmin, deduplicated against any
 * identical grant already produced by an explicit role assignment above.
 */
export function buildInitCalls(params: {
  roles: TokenRoleAssignment[];
  initialAdmin: `0x${string}`;
  initialSupply: string;
  maximumSupply: string | undefined;
  decimals: number;
  mintable?: boolean;
  burnable?: boolean;
  pausable?: boolean;
}): `0x${string}`[] {
  const {
    roles,
    initialAdmin,
    initialSupply,
    maximumSupply,
    decimals,
    mintable,
    burnable,
    pausable,
  } = params;
  const calls: `0x${string}`[] = [];
  const admin = initialAdmin.toLowerCase();
  const granted = new Set<string>(); // `${role}:${address}` already encoded

  const grant = (role: `0x${string}`, address: `0x${string}`) => {
    const key = `${role}:${address.toLowerCase()}`;
    if (granted.has(key)) return;
    granted.add(key);
    calls.push(encodeGrantRoleCall(role, address));
  };

  for (const { role, address } of roles) {
    if (!isAddress(address)) continue;
    if (
      (role === "owner" || role === "admin") &&
      address.toLowerCase() === admin
    ) {
      // Already holds DEFAULT_ADMIN_ROLE via initialAdmin — see above.
      continue;
    }

    switch (role) {
      case "owner":
      case "admin":
        grant(B20_ROLE.DEFAULT_ADMIN_ROLE, address);
        break;
      case "mint":
        grant(B20_ROLE.MINT_ROLE, address);
        break;
      case "burn":
        grant(B20_ROLE.BURN_ROLE, address);
        break;
      case "freeze":
        // Real B20 equivalent of "freeze" is burnBlocked, gated by
        // BURN_BLOCKED_ROLE — see components/dashboard/FreezeManager.tsx
        // for the PolicyRegistry piece this still doesn't cover.
        grant(B20_ROLE.BURN_BLOCKED_ROLE, address);
        break;
      case "transfer":
        // No-op: transfer gating is a PolicyRegistry policy assignment,
        // not a role. Nothing to encode here yet.
        break;
    }
  }

  // Capability toggles fall back to granting initialAdmin, so the
  // capability the dashboard advertises is actually callable on-chain by
  // someone. An explicit role assignment above (e.g. "mint" -> a
  // dedicated minter address) already satisfies this and grant() dedupes
  // against it when that address happens to be initialAdmin.
  if (mintable) grant(B20_ROLE.MINT_ROLE, initialAdmin);
  if (burnable) grant(B20_ROLE.BURN_ROLE, initialAdmin);
  if (pausable) {
    grant(B20_ROLE.PAUSE_ROLE, initialAdmin);
    grant(B20_ROLE.UNPAUSE_ROLE, initialAdmin);
  }

  const initialSupplyBaseUnits = initialSupply
    ? parseUnits(initialSupply, decimals)
    : 0n;
  if (initialSupplyBaseUnits > 0n) {
    calls.push(encodeMintCall(initialAdmin, initialSupplyBaseUnits));
  }

  if (maximumSupply) {
    calls.push(
      encodeUpdateSupplyCapCall(parseUnits(maximumSupply, decimals))
    );
  }

  return calls;
}
