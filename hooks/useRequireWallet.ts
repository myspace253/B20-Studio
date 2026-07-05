import { useAccount } from "wagmi";

/**
 * Returns whether a wallet is connected, plus the connected address.
 * Use to gate actions that need a signer (deploying, minting, burning)
 * rather than duplicating `useAccount` checks across every wizard step.
 */
export function useRequireWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  return { address, isConnected, isConnecting };
}
