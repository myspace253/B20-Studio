import Link from "next/link";

// Placeholder terms — standard sections for a non-custodial on-chain tool,
// but this is boilerplate, not reviewed legal copy. Have counsel review and
// tailor this (especially the liability/no-warranty and jurisdiction
// sections) before treating it as your actual Terms of Service.

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="font-display text-lg text-white">
        Base Studio
      </Link>

      <h1 className="mt-8 font-display text-3xl text-white">Terms of Service</h1>
      <p className="mt-2 text-xs text-fog">Last updated: [date]</p>

      <div className="mt-8 space-y-6 text-sm text-muted">
        <section>
          <h2 className="text-base font-medium text-white">1. What Base Studio is</h2>
          <p className="mt-2">
            Base Studio is a non-custodial interface for creating and
            managing B20 tokens on Base. Base Studio never holds your funds
            or private keys — every transaction is prepared here and signed
            in your own wallet.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">2. Your responsibility</h2>
          <p className="mt-2">
            You are solely responsible for the tokens you create, the roles
            and permissions you assign, and any transaction you sign.
            Deployed tokens and on-chain actions are irreversible. Review
            every transaction in your wallet before confirming.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">3. No warranty</h2>
          <p className="mt-2">
            Base Studio is provided &quot;as is&quot; without warranties of
            any kind. We do not guarantee uninterrupted availability,
            error-free operation, or that any token created here will behave
            in a particular way once deployed to a public blockchain.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">4. Prohibited use</h2>
          <p className="mt-2">
            You may not use Base Studio to create tokens for fraudulent,
            deceptive, or illegal purposes, or in violation of applicable
            law in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">5. Changes</h2>
          <p className="mt-2">
            We may update these terms from time to time. Continued use of
            Base Studio after a change constitutes acceptance of the revised
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-white">6. Contact</h2>
          <p className="mt-2">Questions about these terms: [contact email].</p>
        </section>
      </div>
    </main>
  );
}
