import { create } from "zustand";
import type {
  TokenBasicInfo,
  TokenSupplyConfig,
  TokenRoleAssignment,
  TokenTransferRules,
  TokenomicsAllocation,
} from "@/types/token";

export type DeployNetwork = "base-mainnet" | "base-sepolia";

interface TokenDraftState {
  step: number;
  basicInfo: TokenBasicInfo | null;
  supply: TokenSupplyConfig | null;
  roles: TokenRoleAssignment[];
  transferRules: TokenTransferRules | null;
  tokenomics: TokenomicsAllocation | null;
  network: DeployNetwork;

  setStep: (step: number) => void;
  setBasicInfo: (values: TokenBasicInfo) => void;
  setSupply: (values: TokenSupplyConfig) => void;
  setRoles: (roles: TokenRoleAssignment[]) => void;
  setTransferRules: (values: TokenTransferRules) => void;
  setTokenomics: (values: TokenomicsAllocation) => void;
  setNetwork: (network: DeployNetwork) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  basicInfo: null,
  supply: null,
  roles: [],
  transferRules: null,
  tokenomics: null,
  network: "base-sepolia" as DeployNetwork,
};

/**
 * In-memory wizard draft. Deliberately not persisted to localStorage —
 * artifacts in this codebase must not rely on browser storage, and a
 * server-side draft (via the CreateTokenDraft type + a `POST /api/drafts`
 * endpoint) is the right place to add resume-later support later on.
 */
export const useTokenDraftStore = create<TokenDraftState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setBasicInfo: (basicInfo) => set({ basicInfo }),
  setSupply: (supply) => set({ supply }),
  setRoles: (roles) => set({ roles }),
  setTransferRules: (transferRules) => set({ transferRules }),
  setTokenomics: (tokenomics) => set({ tokenomics }),
  setNetwork: (network) => set({ network }),
  reset: () => set(initialState),
}));
