/**
 * B20 is implemented as node-level Rust precompiles, not deployed contracts,
 * so there's no ABI to import in the usual sense — calls go through fixed
 * precompile addresses defined by the Activation Registry.
 *
 * This file intentionally does NOT hard-code a full interface: Base's
 * Standard Library repository is the source of truth for the exact
 * precompile addresses and call encoding, and it may still change before
 * general availability. Wire the real addresses/encoding in here once
 * confirmed against https://docs.base.org/base-chain/specs/upgrades/beryl/b20
 * — do not guess at addresses for a real deployment.
 */

export const ACTIVATION_REGISTRY_ADDRESS =
  "0x8453000000000000000000000000000000000001" as const;

export const B20_VARIANTS = {
  asset: "asset",
  stablecoin: "stablecoin",
} as const;

export type B20Variant = keyof typeof B20_VARIANTS;
