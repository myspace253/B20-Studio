import Link from "next/link";

const STEPS = [
  {
    title: "1. Choose a variant",
    body: "Asset tokens support configurable decimals (6–18) and general-purpose use. Stablecoins fix 6 decimals and require an issuer-defined currency code (e.g. USD). Both are B20 — a superset of ERC-20 that runs as a native Base precompile instead of a deployed contract.",
  },
  {
    title: "2. Configure supply and roles",
    body: "Set an initial supply, an optional maximum supply cap, and who holds mint, burn, freeze, and pause permissions. Base Studio grants the on-chain roles these capabilities actually require — a token marked \"pausable\" is useless if nobody was ever granted PAUSE_ROLE, so this is handled for you.",
  },
  {
    title: "3. Review and deploy",
    body: "The review step checks the Activation Registry for your chosen network before asking your wallet to sign, predicts the token's deterministic address, and verifies the transaction calldata is well-formed before broadcasting — so you get a clear error instead of a wasted gas revert.",
  },
  {
    title: "4. Manage after launch",
    body: "Once deployed, use the token's dashboard to mint, burn, freeze addresses, adjust transfer rules, and review activity — all as real, wallet-signed transactions verified against the chain, not just database records.",
  },
];

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="font-display text-lg text-white">
        Base Studio
      </Link>

      <h1 className="mt-8 font-display text-3xl text-white">
        Guide to Base Studio
      </h1>
      <p className="mt-3 text-sm text-muted">
        Base Studio is a full-stack interface over Base&apos;s native B20
        token standard. Here&apos;s the shape of the flow, end to end.
      </p>

      <div className="mt-10 space-y-8">
        {STEPS.map((step) => (
          <div key={step.title} className="border-l-2 border-line pl-5">
            <h2 className="text-base font-medium text-white">{step.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-md border border-line bg-surface px-5 py-4">
        <p className="text-sm text-muted">
          Want the full technical spec — roles, policies, the factory, and
          the asset/stablecoin variants?
        </p>
        <a
          href="https://docs.base.org/base-chain/specs/upgrades/beryl/b20"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-base underline"
        >
          Read the B20 spec ↗
        </a>
      </div>

      <Link
        href="/dashboard/create"
        className="mt-10 inline-block rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim"
      >
        Start creating a token
      </Link>
    </main>
  );
}
