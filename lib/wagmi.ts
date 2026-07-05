import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "dev-placeholder-project-id";

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.warn(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Falling back to a placeholder value for build/dev; configure a real Reown project ID for wallet functionality."
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Base Studio",
  projectId: walletConnectProjectId,
  chains: [base, baseSepolia],
  ssr: true,
});
