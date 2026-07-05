"use client";

import { cn } from "@/lib/cn";

const STEPS = [
  "Basic information",
  "Supply",
  "Permissions",
  "Transfer rules",
  "Tokenomics",
  "Review",
] as const;

interface WizardShellProps {
  currentStep: number; // 0-indexed
  children: React.ReactNode;
}

export function WizardShell({ currentStep, children }: WizardShellProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16 md:px-0">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          Create token
        </p>
        <h1 className="mt-2 font-display text-3xl text-white">
          {STEPS[currentStep]}
        </h1>
      </header>

      {/* The sequence here is a real, ordered dependency chain — supply must
          exist before roles can be scoped to it, rules depend on the variant
          chosen in step 2 — so a numbered progression is honest, not decorative. */}
      <ol className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-6 font-mono text-xs">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className={cn(
              "flex items-center gap-2",
              i === currentStep ? "text-white" : "text-fog"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border",
                i === currentStep
                  ? "border-signal text-signal"
                  : i < currentStep
                    ? "border-base bg-base text-white"
                    : "border-line text-fog"
              )}
            >
              {i < currentStep ? "✓" : i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div>{children}</div>
    </div>
  );
}
