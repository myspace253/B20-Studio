"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: "root" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-danger">
        Something went wrong
      </p>
      <h1 className="font-display text-2xl text-white">
        The page hit an unexpected error.
      </h1>
      <p className="max-w-md text-sm text-muted">
        This has been logged. Try again, or head back to the dashboard if it
        keeps happening.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim"
      >
        Try again
      </button>
    </div>
  );
}
