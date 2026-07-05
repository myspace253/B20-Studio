import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

// NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID must be set — RainbowKit throws at
// runtime without it. Get one at https://cloud.reown.com.
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId && process.env.NODE_ENV === "production") {
  // Fail loudly in production rather than shipping a broken connect button.
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Get one at https://cloud.reown.com"
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Base Studio",
  projectId: walletConnectProjectId || "dev-placeholder-project-id",
  chains: [base, baseSepolia],
  ssr: true,
});
