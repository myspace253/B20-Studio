"use client";

import { useSession, signOut } from "next-auth/react";
import { useAccount, useDisconnect } from "wagmi";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { address, chain } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="font-display text-2xl text-white">Settings</h1>

      <section className="space-y-3 rounded-md border border-line bg-surface px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-wide text-fog">
          Wallet
        </p>
        {status === "authenticated" && session?.address ? (
          <>
            <p className="font-mono text-sm text-white">{session.address}</p>
            <p className="text-xs text-muted">
              Signed in{chain ? ` · ${chain.name}` : ""}
            </p>
            <button
              onClick={() => {
                signOut({ redirect: false });
                disconnect();
              }}
              className="mt-2 rounded-md border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-danger hover:text-danger"
            >
              Sign out and disconnect
            </button>
          </>
        ) : address ? (
          <p className="text-sm text-muted">
            Wallet connected but not signed in — use the connect button in
            the top bar to complete Sign-In With Ethereum.
          </p>
        ) : (
          <p className="text-sm text-muted">No wallet connected.</p>
        )}
      </section>
    </div>
  );
}
