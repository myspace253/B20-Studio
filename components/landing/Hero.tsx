"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";
import { ActivationConsole } from "./ActivationConsole";

// R3F pulls in three.js — keep it out of the server bundle and load lazily.
const PrecompileObject = dynamic(
  () => import("./PrecompileObject").then((m) => m.PrecompileObject),
  { ssr: false }
);

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion || !rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero=eyebrow]", { opacity: 0, y: 12, duration: 0.5 })
        .from(
          "[data-hero=headline]",
          { opacity: 0, y: 28, duration: 0.7 },
          "-=0.25"
        )
        .from(
          "[data-hero=sub]",
          { opacity: 0, y: 16, duration: 0.6 },
          "-=0.35"
        )
        .from(
          "[data-hero=cta]",
          { opacity: 0, y: 12, duration: 0.5 },
          "-=0.3"
        )
        .from(
          "[data-hero=console]",
          { opacity: 0, x: 24, duration: 0.7 },
          "-=0.4"
        )
        .from(
          "[data-hero=lattice]",
          { opacity: 0, scale: 0.85, duration: 0.9 },
          "-=0.6"
        );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate flex min-h-screen items-center overflow-hidden bg-ink px-6 py-24 md:px-12"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" data-hero="lattice">
        <PrecompileObject />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-16 md:grid-cols-2 md:items-center">
        <div>
          <p
            data-hero="eyebrow"
            className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-signal"
          >
            Built for the B20 standard on Base
          </p>
          <h1
            data-hero="headline"
            className="font-display text-4xl font-medium leading-[1.05] text-white md:text-6xl"
          >
            Create B20 tokens
            <br />
            in under 60 seconds.
          </h1>
          <p data-hero="sub" className="mt-6 max-w-md text-base text-muted md:text-lg">
            No smart contract to audit. No ABI to hand-roll. Base Studio
            configures the issuer toolkit — roles, supply policy, transfer
            rules — and activates your token directly at the protocol level.
          </p>
          <div data-hero="cta" className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="/dashboard/create"
              className="rounded-md bg-base px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-baseDim"
            >
              Create a token
            </a>
            <a
              href="#how-it-works"
              className="rounded-md border border-line px-6 py-3 text-sm font-medium text-muted transition-colors hover:border-fog hover:text-white"
            >
              See how it works
            </a>
          </div>
        </div>

        <div data-hero="console">
          <ActivationConsole />
        </div>
      </div>
    </section>
  );
}
