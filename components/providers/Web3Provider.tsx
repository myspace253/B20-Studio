"use client";

import { useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  RainbowKitAuthenticationProvider,
  createAuthenticationAdapter,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { SiweMessage } from "siwe";
import { signIn, signOut, useSession } from "next-auth/react";
import { wagmiConfig } from "@/lib/wagmi";

function AuthenticatedRainbowKit({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  // RainbowKit expects 'loading' | 'unauthenticated' | 'authenticated'.
  // next-auth's useSession status maps directly except its values already
  // match, so this is a passthrough — kept explicit so a future next-auth
  // status rename doesn't silently break the wallet modal.
  const authStatus = useMemo(
    () =>
      status === "authenticated"
        ? "authenticated"
        : status === "loading"
          ? "loading"
          : "unauthenticated",
    [status]
  );

  const authenticationAdapter = useMemo(
    () =>
      createAuthenticationAdapter({
        getNonce: async () => {
          const res = await fetch("/api/auth/nonce");
          if (!res.ok) throw new Error("Failed to fetch nonce");
          return res.text();
        },

        createMessage: ({ nonce, address, chainId }) =>
          new SiweMessage({
            domain: window.location.host,
            address,
            statement: "Sign in to Base Studio to create and manage tokens.",
            uri: window.location.origin,
            version: "1",
            chainId,
            nonce,
          }).prepareMessage(),

        verify: async ({ message, signature }) => {
          const response = await signIn("credentials", {
            message,
            signature,
            redirect: false,
          });
          return Boolean(response?.ok);
        },

        signOut: async () => {
          await signOut({ redirect: false });
        },
      }),
    []
  );

  return (
    <RainbowKitAuthenticationProvider
      adapter={authenticationAdapter}
      status={authStatus}
    >
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#0052FF",
          accentColorForeground: "white",
          borderRadius: "medium",
        })}
      >
        {children}
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Created inside the component (not at module scope) so each request
  // gets its own QueryClient under React Server Components / SSR.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthenticatedRainbowKit>{children}</AuthenticatedRainbowKit>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

