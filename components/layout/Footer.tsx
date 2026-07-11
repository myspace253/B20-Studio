import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/dashboard/lookup", label: "Look up" },
  { href: "/dashboard/create", label: "Create" },
  { href: "/dashboard/tokens", label: "Tokens" },
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

// Cross-promo for other things you've built. Swap the placeholder for your
// real projects (Coreledger, OpportunityAI, Skill.md Studio, etc.) — kept
// as a small config array so this stays a one-line edit.
const ALSO_BUILDING: { name: string; blurb: string; href: string }[] = [
  {
    name: "B20-Studio",
    blurb: "https://production-b20-studio.tyzo.nodeops.app/",
    href: "#",
  },
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

function BrandMark() {
  // Small original glyph — a stack of two offset squares, echoing a token
  // "layer" without copying anyone else's mark.
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <rect x="2" y="6" width="12" height="12" rx="2" fill="#232936" />
      <rect x="6" y="2" width="12" height="12" rx="2" fill="#0052FF" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line px-8 py-10">
      <div className="rounded-md border border-line bg-surface px-4 py-3">
        <p className="text-xs text-fog">
          <span className="font-medium text-muted">Security reminder:</span>{" "}
          Base Studio never asks for your seed phrase, private key,
          passwords, or a software download. Every action here is a
          transparent, wallet-signed transaction on Base — always verify the
          contract address, network, and amount before confirming.
        </p>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg text-white">Base Studio</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Create and manage Base B20 tokens. Inspect roles, prepare
            transactions.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="https://x.com/Crypto_ditsy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow on X"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-line text-fog transition-colors hover:border-fog hover:text-white"
            >
              <XIcon />
            </a>
          </div>
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

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-fog">
            Also building
          </p>
          <ul className="mt-3 space-y-3">
            {ALSO_BUILDING.map((project) => (
              <li key={project.name}>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-sm border border-line px-3 py-2 transition-colors hover:border-fog"
                >
                  <p className="text-sm text-white">{project.name}</p>
                  <p className="mt-0.5 text-xs text-fog">{project.blurb}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
        <p className="text-xs text-fog">© {year} Base Studio</p>
        <p className="text-xs text-fog">Built on Base</p>
      </div>
    </footer>
  );
}
