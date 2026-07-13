import {
  decodeErrorResult,
  BaseError,
  RawContractError,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { b20FactoryAbi, b20TokenAbi, b20ErrorsAbi } from "@/contracts/b20";

const combinedAbi = [...b20FactoryAbi, ...b20TokenAbi, ...b20ErrorsAbi] as const;

// Generous headroom above what createB20 + a handful of initCalls should
// ever need. Passed explicitly to eth_call so a restrictive default gas
// cap on the RPC endpoint (some providers cap eth_call well below what a
// real, gas-estimated sendTransaction would get) can't masquerade as a
// genuine on-chain revert.
const SIMULATION_GAS = 5_000_000n;

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

function friendlyFromRevertData(raw: Hex): string {
  try {
    const decoded = decodeErrorResult({ abi: combinedAbi, data: raw });
    const friendly = FRIENDLY_MESSAGES[decoded.errorName];
    return friendly
      ? friendly(decoded.args ?? [])
      : `${decoded.errorName}(${(decoded.args ?? []).join(", ")})`;
  } catch {
    return `unrecognized error (selector ${raw.slice(0, 10)})`;
  }
}

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
      gas: SIMULATION_GAS,
      blockNumber: params.blockNumber - 1n,
    });
    // Call succeeded when replayed — state must have shifted between
    // simulation and the real mined block (e.g. another tx landed first).
    return "Transaction reverted on-chain, but replaying the call one block earlier succeeded — likely a race with another transaction (e.g. the salt or address became taken in between). Try again.";
  } catch (err) {
    const raw = extractRevertData(err, params.data);
    if (!raw) {
      return err instanceof Error
        ? `Transaction reverted on-chain: ${err.message}`
        : "Transaction reverted on-chain (no revert data available from the RPC).";
    }
    return `Reverted: ${friendlyFromRevertData(raw)}`;
  }
}

export interface SimulationResult {
  /**
   * true only when we decoded a specific, named on-chain guard (activation,
   * already-exists, cap math, missing role, etc.) — a confirmed reason to
   * stop before spending gas on a guaranteed failure.
   *
   * false when the simulated call failed but we couldn't get a decodable
   * reason (no revert data returned by the RPC at all). That's inconclusive,
   * not confirmed — some RPC endpoints strip revert data from eth_call
   * responses, and a handful of providers cap eth_call gas below what a
   * real, wallet-estimated sendTransaction would get. Treating an
   * inconclusive simulation as a hard block would mean this pre-send check
   * could itself prevent a deploy that would actually have succeeded — so
   * callers should warn, not block, when this is false.
   */
  blocking: boolean;
  message: string;
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
): Promise<SimulationResult | null> {
  try {
    await publicClient.call({
      to: params.to,
      data: params.data,
      account: params.from,
      gas: SIMULATION_GAS,
    });
    return null;
  } catch (err) {
    const raw = extractRevertData(err, params.data);
    if (!raw) {
      const detail = err instanceof Error ? err.message : "no revert data available from the RPC";
      return {
        blocking: false,
        message: `Pre-send check couldn't confirm this would revert (${detail}) — proceeding to let you sign. If it fails on-chain, the exact reason will be decoded afterward.`,
      };
    }
    return { blocking: true, message: `This would revert: ${friendlyFromRevertData(raw)}` };
  }
}

/**
 * Extracts the real revert bytes from a failed `.call()`, using viem's
 * own typed error class rather than a loose "any object with a `.data`
 * field" walk.
 *
 * That looser version was the actual bug behind a real incident: it
 * matched on unrelated `.data` fields elsewhere in viem's error cause
 * chain (e.g. echoed request metadata), which for one failure mode
 * happened to be the *original call's own calldata* — so the "revert
 * selector" shown to the user was just the createB20 function selector
 * (0x62975e6a) misread as an error selector. That falsely made every
 * deploy look like a guaranteed revert, which is why the wallet never
 * even opened: the pre-send simulateB20Call check was throwing before
 * reaching the signature step.
 *
 * viem's RawContractError is the class that's actually constructed from
 * real eth_call revert output (see viem's actions/public/call.js) — only
 * data pulled from that specific class is trustworthy. As a second,
 * defensive layer, revert data that happens to exactly equal the
 * original request's own calldata is also rejected outright — that can
 * only be a misattribution, never a real revert payload.
 */
function extractRevertData(err: unknown, requestData: Hex): Hex | undefined {
  const rawError =
    err instanceof BaseError
      ? err.walk((e) => e instanceof RawContractError)
      : undefined;

  const data =
    rawError instanceof RawContractError && typeof rawError.data === "string"
      ? (rawError.data as Hex)
      : undefined;

  if (!data || !data.startsWith("0x")) return undefined;
  if (data.toLowerCase() === requestData.toLowerCase()) return undefined;

  return data;
}
