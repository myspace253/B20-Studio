import Link from "next/link";

// Placeholder privacy policy — reflects the app's actual data flows at a
// high level (wallet address, uploaded assets, DB-stored token metadata),
// but isn't reviewed legal copy. Have counsel review before treating this
// as your actual Privacy Policy, especially if you serve users in the EU/UK
// (GDPR) or California (CCPA).

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="font-display text-lg text-white">
        Base Studio
      </Link>

      <h1 className="mt-8 font-display text-3xl text-white">Privacy Policy</h1>
      <p className="mt-2 text-xs text-fog">Last updated: [date]</p>

      <div className="mt-8 space-y-6 text-sm text-muted">
        <section>
          <h2 className="text-base font-medium text-white">1. What we collect</h2>
          <p className="mt-2">
            Your wallet address (when you connect), the token configurations
            you create and save, and any logo images you upload. We do not
            collect or have access to your private keys or seed phrase —
            wallet connections are handled entirely client-side.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">2. On-chain data</h2>
          <p className="mt-2">
            Transactions you sign are broadcast to the Base network and are
            public, permanent, and outside our control once confirmed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">3. How we use it</h2>
          <p className="mt-2">
            To show your token dashboard, verify deployments against the
            chain, and operate the service. We do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">4. Third parties</h2>
          <p className="mt-2">
            We use infrastructure providers (hosting, database, file
            storage, RPC providers) to operate Base Studio. These providers
            process data only as needed to deliver the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">5. Your choices</h2>
          <p className="mt-2">
            You can disconnect your wallet at any time. To request deletion
            of account data we hold, contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">6. Contact</h2>
          <p className="mt-2">Privacy questions: [contact email].</p>
        </section>
      </div>
    </main>
  );
}
