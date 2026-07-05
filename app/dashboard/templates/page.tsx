"use client";

import { useRouter } from "next/navigation";
import { useTokenDraftStore } from "@/lib/store/tokenDraft";
import type { TokenSupplyConfig, TokenomicsAllocation } from "@/types/token";

interface Template {
  id: string;
  label: string;
  description: string;
  supply: Partial<TokenSupplyConfig>;
  tokenomics: TokenomicsAllocation;
}

const TEMPLATES: Template[] = [
  {
    id: "meme",
    label: "Meme coin",
    description: "High supply, community-heavy allocation, no cap.",
    supply: { variant: "asset", initialSupply: "1000000000000", decimals: 18, mintable: false, burnable: true, pausable: false },
    tokenomics: { treasury: 5, team: 5, community: 70, liquidity: 20, airdrop: 0, reserve: 0 },
  },
  {
    id: "stablecoin",
    label: "Stablecoin",
    description: "Fixed 6 decimals, mintable/burnable, no speculative allocation.",
    supply: { variant: "stablecoin", initialSupply: "0", decimals: 6, mintable: true, burnable: true, pausable: true },
    tokenomics: { treasury: 100, team: 0, community: 0, liquidity: 0, airdrop: 0, reserve: 0 },
  },
  {
    id: "dao",
    label: "DAO",
    description: "Treasury-weighted, capped supply, team vesting expected.",
    supply: { variant: "asset", initialSupply: "100000000", decimals: 18, mintable: false, burnable: false, pausable: false },
    tokenomics: { treasury: 40, team: 15, community: 30, liquidity: 10, airdrop: 5, reserve: 0 },
  },
  {
    id: "governance",
    label: "Governance",
    description: "Fixed supply, wide community distribution.",
    supply: { variant: "asset", initialSupply: "1000000000", decimals: 18, mintable: false, burnable: false, pausable: false },
    tokenomics: { treasury: 20, team: 15, community: 45, liquidity: 10, airdrop: 10, reserve: 0 },
  },
  {
    id: "gaming",
    label: "Gaming",
    description: "Mintable for in-game rewards, sizable community pool.",
    supply: { variant: "asset", initialSupply: "5000000000", decimals: 18, mintable: true, burnable: true, pausable: false },
    tokenomics: { treasury: 15, team: 15, community: 50, liquidity: 15, airdrop: 5, reserve: 0 },
  },
  {
    id: "ai",
    label: "AI",
    description: "Mintable for compute incentives, moderate treasury.",
    supply: { variant: "asset", initialSupply: "10000000000", decimals: 18, mintable: true, burnable: true, pausable: false },
    tokenomics: { treasury: 20, team: 10, community: 50, liquidity: 20, airdrop: 0, reserve: 0 },
  },
  {
    id: "nft",
    label: "NFT ecosystem",
    description: "Utility token pairing with an NFT collection.",
    supply: { variant: "asset", initialSupply: "100000000", decimals: 18, mintable: true, burnable: true, pausable: false },
    tokenomics: { treasury: 25, team: 15, community: 40, liquidity: 15, airdrop: 5, reserve: 0 },
  },
  {
    id: "rwa",
    label: "RWA",
    description: "Capped supply, compliance-heavy, low speculative allocation.",
    supply: { variant: "asset", initialSupply: "1000000", maximumSupply: "1000000", decimals: 6, mintable: false, burnable: false, pausable: true },
    tokenomics: { treasury: 60, team: 10, community: 10, liquidity: 10, airdrop: 0, reserve: 10 },
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const draft = useTokenDraftStore();

  const applyTemplate = (template: Template) => {
    draft.reset();
    draft.setSupply({
      variant: template.supply.variant ?? "asset",
      initialSupply: template.supply.initialSupply ?? "0",
      maximumSupply: template.supply.maximumSupply,
      decimals: template.supply.decimals ?? 18,
      mintable: template.supply.mintable ?? false,
      burnable: template.supply.burnable ?? false,
      pausable: template.supply.pausable ?? false,
    });
    draft.setTokenomics(template.tokenomics);
    draft.setStep(0); // still start at Basic Info — name/symbol are template-specific
    router.push("/dashboard/create");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-white">Templates</h1>
        <p className="mt-1 text-sm text-muted">
          Pre-fills supply and tokenomics for the wizard — you still name and
          configure the token yourself.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template)}
            className="rounded-md border border-line bg-surface p-5 text-left transition-colors hover:border-base"
          >
            <p className="font-display text-white">{template.label}</p>
            <p className="mt-1.5 text-xs text-muted">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
