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

`ethers` is a dependency (not just a dev dependency) even though the rest
of the stack uses `viem` — `siwe`'s compatibility module imports it
unconditionally, and webpack fails to bundle without it present.

A production build will show a few benign warnings that are safe to
ignore: `@react-native-async-storage/async-storage` (MetaMask SDK's mobile
deep-linking path, unused on web), `pino-pretty` (WalletConnect's logger,
dev-only pretty-printing), and a "critical dependency" warning from
`viem`'s tempo chain definitions. All three are well-known in the
wagmi/RainbowKit ecosystem and don't affect the build output.

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
| Auth       | Sign-In With Ethereum (SIWE) via next-auth + RainbowKit's auth adapter |
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
app/
  dashboard/
    create/              Create Token Wizard (all 6 steps)
    tokens/               "My tokens" list
    tokens/[id]/          Per-token pages: Overview, Mint, Burn, Metadata,
                          Roles, Analytics, Activity (ownership-checked)
    templates/            Template marketplace — pre-fills the wizard draft
    analytics/            Aggregate analytics across owned tokens
    activity/             Global transaction history
    settings/             Connected wallet + sign out
  api/
    auth/[...nextauth]/   NextAuth route handler
    auth/nonce/           SIWE nonce issuance
    create-token/         Persists a draft, tied to the signed-in wallet
    mint/, burn/          Ownership-checked, calls the (stubbed) chain service
    tokens/[id]/metadata/ Real Prisma-backed metadata updates
    tokens/[id]/roles/    Grant/revoke role records
components/
  landing/            Hero, ActivationConsole (signature element), PrecompileObject (R3F), Navbar
  wizard/              WizardShell + all 6 step forms
  dashboard/           MetadataForm, RolesManager (client components for token pages)
  layout/              Sidebar, DashboardShell, TokenTabs
  ui/                  Shared primitives (TextField, Checkbox, SelectField, etc.)
  providers/           SmoothScrollProvider, Web3Provider (wagmi+RainbowKit+SIWE), SessionAuthProvider
lib/
  auth.ts              NextAuth config — SIWE Credentials provider
  wagmi.ts             wagmi config (Base + Base Sepolia)
  prisma.ts            Prisma client singleton
  tokens.ts            Ownership-scoped queries (getOwnedToken, getOwnedTokens, getOwnedTransactions)
  store/tokenDraft.ts  zustand store holding wizard state across steps
  schemas/             zod schemas, one per wizard step
hooks/                useRequireWallet — gates wallet-only actions
utils/format.ts       truncateAddress, formatTokenAmount, formatPercent
types/                Shared domain types (CreateTokenDraft, etc.)
prisma/               schema.prisma — Users, Wallets, Projects, Tokens, Roles, Deployments, Transactions
services/b20.ts       Chain interaction layer — deploy/mint/burn intentionally throw (see below)
contracts/b20.ts      Activation Registry constants — no invented ABI
```

## Authentication

Sign-In With Ethereum (SIWE), not Clerk/Privy — the wallet you connect via
RainbowKit *is* the identity, so a separate auth provider would just be a
second, disconnected notion of "who owns this token."

Flow: connecting a wallet triggers RainbowKit's authentication step →
`GET /api/auth/nonce` issues a one-time nonce in an httpOnly cookie →
the wallet signs an EIP-4361 message → `POST /api/auth/callback/credentials`
(via next-auth) verifies the signature against that nonce → a JWT session
is issued with `session.address` set to the wallet address. Server
components and API routes call `auth()` from `lib/auth.ts` to read it;
`lib/tokens.ts`'s `getOwnedToken(s)` helpers scope every query to that
address so one wallet can never see or act on another's tokens.

Set `AUTH_SECRET` before running this for real — generate one with
`npx auth secret`.

## What's scaffolded vs. what's next

**Done:** landing page (GSAP + Lenis + R3F + Activation Console), all 6
wizard steps with validation and cross-step state (zustand), SIWE auth
wired end to end, dashboard shell + sidebar, "My tokens" list, per-token
pages (Overview/Mint/Burn/Freeze/Transfer rules/Metadata/Roles/Analytics/Activity)
with real ownership checks, a functional template marketplace, Prisma
schema, and API routes for create/mint/burn/freeze/metadata/roles/transfer-rules.

The wizard's full draft (roles, transfer rules, tokenomics — not just
name/symbol/supply) is now actually sent to and persisted by
`/api/create-token`; earlier this was silently dropped on submit. Mint,
burn, and freeze all write a `Transaction` row on success, and a
successful deploy writes a `Deployment` row — these code paths just won't
fire yet since the chain calls they depend on aren't implemented (see
below).

**Intentionally stubbed, not broken:** every function in `services/b20.ts`
(`deployB20Token`, `mintB20Token`, `burnB20Token`, `freezeB20Address`,
`unfreezeB20Address`) throws on purpose — Base's B20 precompile ABI isn't
public yet, so nothing here pretends to move real tokens. Every page and
API route that depends on one of these is fully wired up to call it;
once the real SDK lands, only `services/b20.ts` needs to change.

**Not started:** on-chain indexing (holder counts, transfer volume — these
need a subgraph or log-scanning job, not just a database), multi-project
support (the `Project` model exists but there's no project switcher — one
project per wallet is hardcoded), network selection in the UI (mint/burn/
deploy are hardcoded to `base-sepolia`), file uploads for logo/banner, the
Explorer, the AI features from the product doc (Token Generator,
Tokenomics Generator, Audit, Whitepaper), tests, CI, and rate limiting.

## Getting started

```bash
npm install
cp .env.example .env
# generate AUTH_SECRET into .env:
npx auth secret
npm run db:push   # once DATABASE_URL is set
npm run dev
```
