"use client";

import { useEffect, useState } from "react";

/**
 * Signature element for the landing hero.
 *
 * B20 tokens aren't deployed contracts — they're Rust precompiles wired
 * directly into the node, activated through the on-chain Activation
 * Registry. This console makes that distinction the actual visual thesis
 * of the page: instead of a generic "minting coin" animation, it shows the
 * literal sequence a B20 token goes through, in the monospace register a
 * builder would recognize from a real deploy log.
 */
const STEPS = [
  { label: "resolve", text: "Reading Activation Registry @ 0x8453…0001" },
  { label: "compile", text: "Registering precompile · variant: Asset" },
  { label: "policy", text: "Attaching supply cap · transfer policy: open" },
  { label: "roles", text: "Granting MINT_ROLE, BURN_ROLE to issuer" },
  { label: "deploy", text: "Token live · contract, ABI, audit queue" },
];

export function ActivationConsole() {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    if (visibleSteps >= STEPS.length) return;
    const delay = visibleSteps === 0 ? 400 : 650;
    const timer = setTimeout(() => setVisibleSteps((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleSteps]);

  return (
    <div className="rounded-md border border-line bg-surface/80 backdrop-blur-sm font-mono text-sm">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-base/70" />
        <span className="ml-2 text-xs text-fog">base-studio · deploy</span>
      </div>
      <ul className="space-y-2.5 px-4 py-4">
        {STEPS.slice(0, visibleSteps).map((step, i) => {
          const isFinal = i === STEPS.length - 1;
          return (
            <li key={step.label} className="flex gap-3">
              <span className={isFinal ? "text-signal" : "text-base"}>
                {isFinal ? "✓" : "→"}
              </span>
              <span className="text-fog">[{step.label}]</span>
              <span className={isFinal ? "text-white" : "text-muted"}>
                {step.text}
              </span>
            </li>
          );
        })}
        {visibleSteps < STEPS.length && (
          <li className="flex gap-3">
            <span className="text-base animate-console-blink">▍</span>
          </li>
        )}
      </ul>
    </div>
  );
}
