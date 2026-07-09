import type { ReactNode } from "react";

/**
 * The literal sequence createB20() runs, laid out as a real process —
 * this is order-dependent (you can't attach a transfer policy to a token
 * that doesn't exist yet), so numbered steps encode something true here
 * rather than decorating four unrelated feature bullets.
 */
const STEPS: {
  index: string;
  title: string;
  description: ReactNode;
  detail: string;
}[] = [
  {
    index: "01",
    title: "Pick a variant",
    description: (
      <>
        <span className="text-white">Asset</span> for general issuance —
        configurable 6–18 decimals, a rebase multiplier, on-chain
        announcements, and batched issuance.{" "}
        <span className="text-white">Stablecoin</span> for fiat-backed
        tokens — fixed 6 decimals and an issuer-declared currency code.
      </>
    ),
    detail: "variant: Asset | Stablecoin",
  },
  {
    index: "02",
    title: "Configure the issuer toolkit",
    description:
      "Set name, symbol, decimals, and admin. Batch role grants (MINT_ROLE, BURN_ROLE, PAUSE_ROLE), a supply cap, and transfer policies into the same call as initCalls — no separate setup transactions after deploy.",
    detail: "params + initCalls[]",
  },
  {
    index: "03",
    title: "Base Studio calls the factory",
    description:
      "One transaction to the singleton B20Factory precompile — createB20(variant, salt, params, initCalls). The Activation Registry gates it: the call reverts with FeatureNotActivated until your target network has switched the variant on.",
    detail: "B20Factory.createB20(...)",
  },
  {
    index: "04",
    title: "Live at the protocol level",
    description:
      "Your token runs as a Rust precompile inside the node, not EVM bytecode — cheaper transfers, no audit queue, no ABI to hand-roll. It's still ERC-20 selector-compatible, so wallets, exchanges, and explorers treat it like any other token from the first block.",
    detail: "no contract · no audit · live",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-line bg-ink px-6 py-24 md:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-signal">
          How it works
        </p>
        <h2 className="max-w-2xl font-display text-3xl font-medium leading-tight text-white md:text-4xl">
          From factory call to live token, in one transaction.
        </h2>
        <p className="mt-4 max-w-xl text-base text-muted">
          Base Studio doesn&apos;t deploy a contract for you to audit — it
          assembles the exact calldata the B20 standard expects and calls the
          protocol directly.
        </p>

        <ol className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.index} className="flex gap-5">
              <span className="shrink-0 font-mono text-sm text-fog">
                {step.index}
              </span>
              <div className="border-l border-line pl-5">
                <h3 className="font-display text-lg font-medium text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
                <p className="mt-3 font-mono text-xs text-fog">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-line pt-10">
          <a
            href="/dashboard/create"
            className="rounded-md bg-base px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-baseDim"
          >
            Create a token
          </a>
          <a
            href="https://docs.base.org/get-started/launch-b20-token"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-line px-6 py-3 text-sm font-medium text-muted transition-colors hover:border-fog hover:text-white"
          >
            Read the B20 docs
          </a>
        </div>
      </div>
    </section>
  );
}
