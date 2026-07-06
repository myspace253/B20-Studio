const EXPLORER_BASE = {
  "base-mainnet": "https://basescan.org",
  "base-sepolia": "https://sepolia.basescan.org",
} as const;

export function explorerAddressUrl(
  network: "base-mainnet" | "base-sepolia",
  address: string
): string {
  return `${EXPLORER_BASE[network]}/address/${address}`;
}

export function explorerTxUrl(
  network: "base-mainnet" | "base-sepolia",
  txHash: string
): string {
  return `${EXPLORER_BASE[network]}/tx/${txHash}`;
}
