"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/**
 * Animates a raw base-unit token amount counting up to its formatted
 * value on mount. Only the integer part is animated (as a float — fine
 * for display purposes even on huge supplies, since every frame re-runs
 * the exact BigInt formatter on the rounded value); the fractional
 * remainder, if any, is static from the first frame since animating it
 * adds motion without adding information.
 */
export function AnimatedTokenAmount({
  raw,
  decimals,
}: {
  raw: string | bigint;
  decimals: number;
}) {
  const value = typeof raw === "bigint" ? raw : BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction === BigInt(0)
    ? ""
    : `.${fraction.toString().padStart(decimals, "0").replace(/0+$/, "")}`;

  // Number() loses precision on very large supplies — acceptable here
  // since it only drives the animated frames; see formatWhole below.
  const targetWhole = Number(whole);

  const reduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);
  const [displayWhole, setDisplayWhole] = useState(
    reduceMotion ? targetWhole : 0
  );

  useEffect(() => {
    if (hasAnimated.current || reduceMotion) return;
    hasAnimated.current = true;
    const controls = animate(0, targetWhole, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayWhole(v),
    });
    return () => controls.stop();
  }, [targetWhole, reduceMotion]);

  return (
    <>
      {Math.round(displayWhole).toLocaleString("en-US")}
      {fractionStr}
    </>
  );
}
