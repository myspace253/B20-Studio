import {
  decodeErrorResult,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { b20FactoryAbi, b20TokenAbi, b20ErrorsAbi } from "@/contracts/b20";

const combinedAbi = [...b20FactoryAbi, ...b20TokenAbi, ...b20ErrorsAbi] as const;

const FRIENDLY_MESSAGES: Record<string, (args: readonly unknown[]) => string> = {
  FeatureNotActivated: () =>
    "This B20 variant isn't activated on this network yet — check the Activation Registry before retrying.",
  TokenAlreadyExists: () =>
    "A token already exists at the address this salt would produce. Retry — the wizard generates a fresh salt each attempt.",
  AbiDecodeFailed: () =>
    "The factory rejected the calldata as non-canonical. This points at an encoding bug — please report it rather than retrying blindly.",
  InvalidSupplyCap: (args) =>
    `Invalid supply cap${args.length ? ` (attempted ${args[0]}, current supply ${args[1]})` : ""} — it must be at or above current supply and at or below type(uint128).max.`,
  SupplyCapExceeded: (args) =>
    `This mint would push total supply past the configured cap${args.length ? ` (attempted ${args[0]}, cap ${args[1]})` : ""}.`,
  PolicyForbids: () =>
    "A transfer or mint policy (allowlist/blocklist) is blocking this account.",
  LastAdminCannotRenounce: () =>
    "The last DEFAULT_ADMIN_ROLE holder can't be removed this way — use renounceLastAdmin() to go admin-less.",
  AccessControlUnauthorizedAccount: (args) =>
    `Missing role${args.length ? ` — account ${args[0]} needs role ${args[1]}` : ""} for this action.`,
  InvalidDecimals: () => "Asset decimals must be between 6 and 18.",
  InvalidCurrency: () => "Stablecoin currency code must be uppercase A–Z only.",
  InternalCallFailed: () => "A call inside announce() failed.",
};

/**
 * Replays a transaction's exact call at the block right before it landed
 * and tries to decode the revert into a human-readable reason, instead of
 * the generic "Transaction reverted on-chain." This is what should have
 * told us "FeatureNotActivated" or "TokenAlreadyExists" directly instead
 * of requiring a manual calldata decode + web search to figure out.
 *
 * Best-effort: if the RPC doesn't return revert data, or the error
 * doesn't match one of our known signatures, this falls back to
 * whatever raw information is available rather than throwing.
 */
export async function decodeRevertReason(
  publicClient: PublicClient,
  params: { to: Address; data: Hex; from: Address; blockNumber: bigint }
): Promise<string> {
  try {
    await publicClient.call({
      to: params.to,
      data: params.data,
      account: params.from,
      blockNumber: params.blockNumber - 1n,
    });
    // Call succeeded when replayed — state must have shifted between
    // simulation and the real mined block (e.g. another tx landed first).
    return "Transaction reverted on-chain, but replaying the call one block earlier succeeded — likely a race with another transaction (e.g. the salt or address became taken in between). Try again.";
  } catch (err) {
    const raw = extractRevertData(err);
    if (!raw) {
      return err instanceof Error
        ? `Transaction reverted on-chain: ${err.message}`
        : "Transaction reverted on-chain (no revert data available from the RPC).";
    }
    try {
      const decoded = decodeErrorResult({ abi: combinedAbi, data: raw });
      const friendly = FRIENDLY_MESSAGES[decoded.errorName];
      const detail = friendly
        ? friendly(decoded.args ?? [])
        : `${decoded.errorName}(${(decoded.args ?? []).join(", ")})`;
      return `Reverted: ${detail}`;
    } catch {
      return `Transaction reverted on-chain with an unrecognized error (selector ${raw.slice(0, 10)}). Report this selector so it can be added to the known error list.`;
    }
  }
}

/**
 * Pre-send check: replays the exact call against current chain state
 * before asking the wallet to sign, so most reverts (activation,
 * already-exists, cap math, etc.) surface as a clear message instead of
 * wasting gas on a guaranteed on-chain failure. Returns null if the call
 * would succeed.
 */
export async function simulateB20Call(
  publicClient: PublicClient,
  params: { to: Address; data: Hex; from: Address }
): Promise<string | null> {
  try {
    await publicClient.call({ to: params.to, data: params.data, account: params.from });
    return null;
  } catch (err) {
    const raw = extractRevertData(err);
    if (!raw) {
      return err instanceof Error
        ? `Simulated call reverted: ${err.message}`
        : "Simulated call reverted (no revert data available from the RPC).";
    }
    try {
      const decoded = decodeErrorResult({ abi: combinedAbi, data: raw });
      const friendly = FRIENDLY_MESSAGES[decoded.errorName];
      const detail = friendly
        ? friendly(decoded.args ?? [])
        : `${decoded.errorName}(${(decoded.args ?? []).join(", ")})`;
      return `This would revert: ${detail}`;
    } catch {
      return `This would revert with an unrecognized error (selector ${raw.slice(0, 10)}).`;
    }
  }
}

/** Digs through viem's error cause chain for the raw revert bytes, if the RPC returned any. */
function extractRevertData(err: unknown): Hex | undefined {
  let current: unknown = err;
  for (let i = 0; i < 10 && current; i++) {
    if (
      typeof current === "object" &&
      current !== null &&
      "data" in current &&
      typeof (current as { data?: unknown }).data === "string" &&
      (current as { data: string }).data.startsWith("0x")
    ) {
      return (current as { data: Hex }).data;
    }
    current =
      typeof current === "object" && current !== null && "cause" in current
        ? (current as { cause?: unknown }).cause
        : undefined;
  }
  return undefined;
}
