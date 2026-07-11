import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/dashboard/lookup", label: "Look up" },
  { href: "/dashboard/create", label: "Create" },
];

const RESOURCE_LINKS = [
  { href: "/guide", label: "Guide" },
  {
    href: "https://docs.base.org/base-chain/specs/upgrades/beryl/b20",
    label: "B20 spec ↗",
    external: true,
  },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted transition-colors hover:text-white"
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="text-sm text-muted transition-colors hover:text-white"
    >
      {label}
    </Link>
  );
}

function XIcon() {
  // The current X logo — lucide-react (0.383.0) only ships the old bird
  // mark under "Twitter", so this is a small inline SVG instead.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line px-8 py-10">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-display text-lg text-white">
            Base Studio
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Create and manage Base B20 tokens. Inspect roles, prepare
            transactions.
          </p>
          <a
            href="https://x.com/Crypto_ditsy"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow on X"
            className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-line text-fog transition-colors hover:border-fog hover:text-white"
          >
            <XIcon />
          </a>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-fog">
            Product
          </p>
          <ul className="mt-3 space-y-2.5">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <FooterLink {...link} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-fog">
            Resources
          </p>
          <ul className="mt-3 space-y-2.5">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.href}>
                <FooterLink {...link} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-line bg-surface px-4 py-3">
        <p className="text-xs text-fog">
          <span className="font-medium text-muted">Security reminder:</span>{" "}
          Base Studio never asks for your seed phrase or private key. Every
          transaction is signed in your own wallet — always verify the
          contract address, network, and amount before confirming.
        </p>
      </div>
    </footer>
  );
}
