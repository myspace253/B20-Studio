import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">404</p>
      <h1 className="font-display text-2xl text-white">
        This page doesn&apos;t exist.
      </h1>
      <Link
        href="/"
        className="mt-2 rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim"
      >
        Back to Base Studio
      </Link>
    </div>
  );
}
