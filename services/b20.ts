export type Network = "base-mainnet" | "base-sepolia";

/**
 * deployB20Token and mintB20Token used to live here as explicit-throw
 * stubs. They're gone now — deploy and mint are real client-signed
 * transactions (see components/wizard/StepReview.tsx and
 * components/dashboard/MintForm.tsx), verified server-side in
 * lib/verifyDeployment.ts and lib/verifyTokenAction.ts rather than
 * attempted from the server.
 *
 * burn and freeze still need the identical conversion — they currently
 * throw here and their API routes/pages haven't been rewired to sign
 * client-side yet. The pattern to follow is exactly what mint just did:
 * a client component using useB20Transaction + b20TokenAbi, then the API
 * route calls verifyTokenActionTx instead of attempting the call itself.
 */

export async function burnB20Token(
  _contractAddress: string,
  _amount: string,
  _network: Network
): Promise<{ txHash: `0x${string}` }> {
  throw new Error(
    "burnB20Token still runs server-side and isn't wired to a real chain call — convert it to a client-signed transaction like mint, then remove this stub."
  );
}

export async function freezeB20Address(
  _contractAddress: string,
  _address: string,
  _network: Network
): Promise<{ txHash: `0x${string}` }> {
  throw new Error(
    "freezeB20Address still runs server-side and isn't wired to a real chain call — the real mechanism is burnBlocked gated by BURN_BLOCKED_ROLE, plus a PolicyRegistry blocklist assignment this doesn't handle yet."
  );
}

export async function unfreezeB20Address(
  _contractAddress: string,
  _address: string,
  _network: Network
): Promise<{ txHash: `0x${string}` }> {
  throw new Error(
    "unfreezeB20Address still runs server-side and isn't wired to a real chain call."
  );
}
