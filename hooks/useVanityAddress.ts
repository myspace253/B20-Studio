"use client";

import { useCallback, useRef, useState } from "react";
import type { PublicClient } from "viem";
import { keccak256, toHex } from "viem";
import { b20FactoryAbi, B20_FACTORY_ADDRESS } from "@/contracts/b20";

export interface VanityMatch {
  salt: `0x${string}`;
  address: `0x${string}`;
  attempts: number;
}

export type VanityStatus = "idle" | "searching" | "found" | "not-found" | "error";

const BATCH_SIZE = 40;
const MAX_ATTEMPTS = 2000; // ~4 hex chars is already a ~1/65536 shot per try

/**
 * Searches for a salt whose resulting B20 token address ends with a
 * chosen suffix. Only the trailing 9 bytes of a B20 address are
 * salt-derived — the leading 10-byte B20 prefix and the 1-byte variant
 * marker are identical for every token of that variant, so a prefix
 * search right after "0x" would never terminate. This only ever matches
 * against the end of the address.
 *
 * Each batch of candidate salts is checked against the real
 * B20Factory.getB20Address via multicall, rather than reimplementing the
 * [prefix][variant][keccak256(deployer, salt)] derivation client-side —
 * the docs describe that layout structurally but don't give the exact
 * packing (packed vs. padded encoding, argument order), and getting that
 * wrong would silently show the user a vanity address that doesn't match
 * what actually deploys. Multicall3 is deployed at the same canonical
 * address on every chain viem's `base` / `baseSepolia` definitions target,
 * so this stays a small number of RPC round-trips even at hundreds of
 * candidates.
 */
export function useVanityAddress(
  publicClient: PublicClient | undefined,
  variant: number,
  sender: `0x${string}` | undefined
) {
  const [status, setStatus] = useState<VanityStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const [match, setMatch] = useState<VanityMatch | null>(null);
  const cancelRef = useRef(false);

  const search = useCallback(
    async (suffix: string) => {
      const clean = suffix.trim().toLowerCase().replace(/^0x/, "");
      if (!/^[0-9a-f]{1,6}$/.test(clean)) {
        setStatus("error");
        return null;
      }
      if (!publicClient || !sender) {
        setStatus("error");
        return null;
      }

      cancelRef.current = false;
      setStatus("searching");
      setAttempts(0);
      setMatch(null);

      let totalChecked = 0;
      while (totalChecked < MAX_ATTEMPTS) {
        if (cancelRef.current) {
          setStatus("idle");
          return null;
        }

        const salts = Array.from({ length: BATCH_SIZE }, () =>
          keccak256(toHex(`${sender}-${Date.now()}-${Math.random()}`))
        ) as `0x${string}`[];

        const results = await publicClient.multicall({
          contracts: salts.map((salt) => ({
            address: B20_FACTORY_ADDRESS,
            abi: b20FactoryAbi,
            functionName: "getB20Address",
            args: [variant, sender, salt],
          })),
        });

        totalChecked += BATCH_SIZE;
        setAttempts(totalChecked);

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status !== "success") continue;
          const addr = (result.result as string).toLowerCase();
          if (addr.endsWith(clean)) {
            const found: VanityMatch = {
              salt: salts[i],
              address: addr as `0x${string}`,
              attempts: totalChecked,
            };
            setMatch(found);
            setStatus("found");
            return found;
          }
        }
      }

      setStatus("not-found");
      return null;
    },
    [publicClient, variant, sender]
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setStatus("idle");
    setAttempts(0);
    setMatch(null);
  }, []);

  return { search, cancel, reset, status, attempts, match };
}
