# Base Studio

The easiest way to create, deploy, manage, and analyze **B20 tokens** on Base —
Base's native token standard, introduced in the Beryl upgrade (mainnet
activation targeted June 25, 2026; confirm the Activation Registry is enabled
before deploying, as the mainnet flag rollout has been delayed pending a
stability fix).

## Security note

`next` is pinned to `15.5.20` (the latest maintained release on the 15.x
line) and `react`/`react-dom` to `19.2.1`. 15.3.8 only carried the backport
for the critical December 2025 RSC RCE (CVE-2025-66478 / CVE-2025-55182,
CVSS 10.0); several further Next.js advisories (SSRF via middleware
redirects, RSC cache poisoning, image-optimization DoS, and others) are
only fixed on 15.5.x. Don't downgrade below `15.5.20` on the 15.x line
without checking [Next.js's security advisories](https://github.com/vercel/next.js/security/advisories)
first — or better, plan a move to Next 16 once you've verified it against
this codebase.

## Stack

| Layer      | Choice                                                            |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 15 (App Router), React 19, TypeScript                     |
| Styling    | Tailwind CSS, design tokens in `tailwind.config.ts`                |
| Motion     | Framer Motion (UI/dashboard), GSAP + ScrollTrigger (landing/marketing) |
| Scroll     | Lenis, wired to GSAP's ticker in `SmoothScrollProvider`            |
| 3D         | React Three Fiber — scoped to the landing hero only                |
| Wallet     | wagmi, viem, RainbowKit, Coinbase Wallet SDK                       |
| Forms      | react-hook-form + zod                                              |
| Backend    | Next.js API routes (Hono planned for heavier endpoints)           |
| Data       | PostgreSQL via Prisma                                              |
| Storage    | Supabase, Cloudflare R2                                            |
| Auth       | Clerk / Privy                                                      |
| Analytics  | PostHog                                                             |

**Animation layering rule:** GSAP + Lenis + R3F stay on the marketing/landing
surface (`app/page.tsx`, `components/landing/`). The dashboard and wizard use
Framer Motion only — a data-dense app screen should stay fast and responsive,
not scroll-jacked.

## Design tokens

Defined in `tailwind.config.ts`:

- `ink` (#0A0E14) — primary background
- `base` (#0052FF) — primary accent, Base's own protocol blue
- `signal` (#C4F135) — activation / mint / "live" states
- `danger` (#FF5D5D) — burn / freeze / destructive actions
- `mono` font (JetBrains Mono) — addresses, hashes, gas estimates, the
  activation console

## Structure

```
app/                  Routes (App Router)
  dashboard/create/    Create Token Wizard
  api/create-token/    API route stub
components/
  landing/             Hero, ActivationConsole (signature element), PrecompileObject (R3F)
  wizard/              WizardShell, per-step forms
  ui/                  Shared primitives (TextField, etc.)
  providers/           SmoothScrollProvider (Lenis + GSAP)
lib/                  Schemas, utils, cn()
types/                Shared domain types (CreateTokenDraft, etc.)
prisma/               schema.prisma — Users, Wallets, Projects, Tokens, Deployments
```

## What's scaffolded vs. what's next

**Done:** landing page hero (GSAP timeline + Lenis smooth scroll + R3F
lattice + the Activation Console signature element), Wizard Step 1 (Basic
Information) with validation, Prisma schema, API route stub.

**Not yet wired:** steps 2–6 of the wizard (Supply, Permissions, Transfer
Rules, Tokenomics, Review), the actual B20 SDK/precompile calls in
`services/`, wallet connection UI, the dashboard shell and analytics views,
AI Token Generator / Tokenomics Generator / Audit / Whitepaper features.

## Getting started

```bash
npm install --legacy-peer-deps
cp .env.example .env
npm run db:push   # once DATABASE_URL is set
npm run dev
```
