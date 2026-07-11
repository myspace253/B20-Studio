"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { getOwnedToken } from "@/lib/tokens";
import { formatTokenAmount, formatPercent } from "@/utils/format";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/explorer";
import { AnimatedTokenAmount } from "./AnimatedTokenAmount";

type OwnedToken = NonNullable<Awaited<ReturnType<typeof getOwnedToken>>>;

function useStagger() {
  const reduceMotion = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.07 },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };
  return { container, item };
}

function StatCard({
  label,
  value,
  variants,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  variants: Variants;
  muted?: boolean;
}) {
  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -2, borderColor: "#5B6274" }}
      transition={{ duration: 0.15 }}
      className="rounded-md border border-line bg-surface px-5 py-4"
    >
      <p className="font-mono text-xs uppercase tracking-wide text-fog">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-xl ${muted ? "text-fog" : "text-white"}`}
      >
        {value}
      </p>
    </motion.div>
  );
}

export function TokenInsights({ token }: { token: OwnedToken }) {
  const { container, item } = useStagger();
  const isDeployed = !token.contractAddress.startsWith("pending-");
  const network = token.network as "base-mainnet" | "base-sepolia";

  const initial = BigInt(token.initialSupply);
  const max = token.maximumSupply ? BigInt(token.maximumSupply) : null;
  const utilizationPct = max && max > 0n ? Number((initial * 10000n) / max) / 100 : null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-8"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Network" value={token.network} variants={item} />
        <StatCard
          label="Initial supply"
          value={<AnimatedTokenAmount raw={token.initialSupply} decimals={token.decimals} />}
          variants={item}
        />
        <StatCard
          label="Max supply"
          value={
            token.maximumSupply ? (
              <AnimatedTokenAmount raw={token.maximumSupply} decimals={token.decimals} />
            ) : (
              "Uncapped"
            )
          }
          variants={item}
        />
        {/* Holders/volume need an indexer reading transfer events on-chain —
            not real until the token is actually deployed and indexed, so
            these are honest placeholders rather than fabricated numbers. */}
        <StatCard label="Holders" value="—" variants={item} muted />
      </div>

      {/* Real, computable insight — no indexer required. */}
      {utilizationPct !== null && (
        <motion.div
          variants={item}
          className="rounded-md border border-line bg-surface px-5 py-4"
        >
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-xs uppercase tracking-wide text-fog">
              Supply cap utilization
            </p>
            <p className="font-mono text-sm text-white">
              {formatPercent(utilizationPct)}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-base"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilizationPct, 100)}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
          <p className="mt-2 text-xs text-fog">
            {formatTokenAmount(token.initialSupply, token.decimals)} of{" "}
            {formatTokenAmount(token.maximumSupply!, token.decimals)} mintable
            supply issued so far.
          </p>
        </motion.div>
      )}

      <motion.div
        variants={item}
        className="rounded-md border border-line bg-surface px-5 py-4"
      >
        <p className="font-mono text-xs uppercase tracking-wide text-fog">
          Status
        </p>
        {!isDeployed ? (
          <p className="mt-1 text-sm text-white">
            Draft — not yet deployed on-chain.
          </p>
        ) : (
          <div className="mt-1 space-y-1.5 text-sm">
            <p>
              <a
                href={explorerAddressUrl(network, token.contractAddress)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-base hover:underline"
              >
                {token.contractAddress}
              </a>
              <span className="ml-2 text-xs text-fog">View on Basescan ↗</span>
            </p>
            {token.deployments[0] && (
              <p>
                <a
                  href={explorerTxUrl(network, token.deployments[0].txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-muted hover:underline"
                >
                  {token.deployments[0].txHash}
                </a>
                <span className="ml-2 text-xs text-fog">Deploy transaction ↗</span>
              </p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
