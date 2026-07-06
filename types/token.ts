export type B20Variant = "asset" | "stablecoin";

export interface TokenBasicInfo {
  name: string;
  symbol: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface TokenSupplyConfig {
  variant: B20Variant;
  initialSupply: string; // kept as string to avoid float precision loss
  maximumSupply?: string;
  decimals: number; // fixed at 6 for stablecoin variant
  currency?: string; // required for stablecoin variant — immutable ISO code, uppercase A-Z
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
}

export type TokenRole = "owner" | "admin" | "mint" | "burn" | "freeze" | "transfer";

export interface TokenRoleAssignment {
  role: TokenRole;
  address: string;
}

export type TransferRuleType =
  | "allow_everyone"
  | "whitelist_only"
  | "blacklist"
  | "country_restrictions"
  | "kyc_required"
  | "max_wallet"
  | "max_transaction";

export interface TokenTransferRules {
  type: TransferRuleType;
  value?: string; // e.g. max wallet amount, country code list (comma separated)
}

export interface TokenomicsAllocation {
  treasury: number;
  team: number;
  community: number;
  liquidity: number;
  airdrop: number;
  reserve: number;
}

export interface CreateTokenDraft {
  basicInfo: TokenBasicInfo;
  supply: TokenSupplyConfig;
  roles: TokenRoleAssignment[];
  transferRules: TokenTransferRules;
  tokenomics: TokenomicsAllocation;
}
