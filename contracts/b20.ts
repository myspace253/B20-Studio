import { keccak256, toHex } from "viem";

/**
 * Fixed on every network per Base's docs — the same factory address on
 * mainnet, Sepolia, and Vibenet.
 * Source: https://docs.base.org/get-started/launch-b20-token
 */
export const B20_FACTORY_ADDRESS =
  "0xB20f000000000000000000000000000000000000" as const;

/** Source: github.com/base/base-std IActivationRegistry.sol usage in the docs guide. */
export const ACTIVATION_REGISTRY_ADDRESS =
  "0x8453000000000000000000000000000000000001" as const;

/**
 * Singleton PolicyRegistry precompile — manages the allowlist/blocklist
 * policies B20 tokens reference by uint64 ID for transfer/mint gating.
 * Not wired into any transfer-rules UI yet (see StepTransferRules.tsx /
 * FreezeManager.tsx) — this is just the address, so that work has
 * something correct to build on rather than a hardcoded string.
 * Source: https://docs.base.org/base-chain/specs/upgrades/beryl/b20#policy-registry
 */
export const POLICY_REGISTRY_ADDRESS =
  "0x8453000000000000000000000000000000000002" as const;

/** Matches IB20Factory.B20Variant enum ordering exactly (ASSET = 0, STABLECOIN = 1). */
export const B20_VARIANT = { asset: 0, stablecoin: 1 } as const;

/**
 * ActivationRegistry feature ids — keccak256 of the literal strings shown
 * in Base's docs guide ("Verify the Activation Registry is enabled").
 */
export const ACTIVATION_FEATURE_ID = {
  asset: keccak256(toHex("base.b20_asset")),
  stablecoin: keccak256(toHex("base.b20_stablecoin")),
} as const;

/**
 * Role constants from B20Constants.sol — every value is keccak256 of the
 * literal role name except DEFAULT_ADMIN_ROLE, which is bytes32(0).
 */
export const B20_ROLE = {
  // bytes32(0) — the zero role, per B20Constants.sol.
  DEFAULT_ADMIN_ROLE: (`0x${"0".repeat(64)}`) as `0x${string}`,
  MINT_ROLE: keccak256(toHex("MINT_ROLE")),
  BURN_ROLE: keccak256(toHex("BURN_ROLE")),
  BURN_BLOCKED_ROLE: keccak256(toHex("BURN_BLOCKED_ROLE")),
  PAUSE_ROLE: keccak256(toHex("PAUSE_ROLE")),
  UNPAUSE_ROLE: keccak256(toHex("UNPAUSE_ROLE")),
  METADATA_ROLE: keccak256(toHex("METADATA_ROLE")),
  OPERATOR_ROLE: keccak256(toHex("OPERATOR_ROLE")),
} as const;

/** Policy scopes — also keccak256 of the literal name, per B20Constants.sol. */
export const B20_POLICY_SCOPE = {
  TRANSFER_SENDER_POLICY: keccak256(toHex("TRANSFER_SENDER_POLICY")),
  TRANSFER_RECEIVER_POLICY: keccak256(toHex("TRANSFER_RECEIVER_POLICY")),
  TRANSFER_EXECUTOR_POLICY: keccak256(toHex("TRANSFER_EXECUTOR_POLICY")),
  MINT_RECEIVER_POLICY: keccak256(toHex("MINT_RECEIVER_POLICY")),
} as const;

/** IB20Factory.sol — only the entry points this app calls. */
export const b20FactoryAbi = [
  {
    type: "function",
    name: "createB20",
    stateMutability: "payable",
    inputs: [
      { name: "variant", type: "uint8" },
      { name: "salt", type: "bytes32" },
      { name: "params", type: "bytes" },
      { name: "initCalls", type: "bytes[]" },
    ],
    outputs: [{ name: "token", type: "address" }],
  },
  {
    type: "function",
    name: "getB20Address",
    stateMutability: "view",
    inputs: [
      { name: "variant", type: "uint8" },
      { name: "sender", type: "address" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "isB20",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "isB20Initialized",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/**
 * Named B20/ActivationRegistry revert reasons referenced across Base's
 * docs (docs.base.org/base-chain/specs/upgrades/beryl/b20 and the
 * launch-b20-token quickstart). Base doesn't publish the exact Solidity
 * error signatures (arg types) anywhere public as of this writing — these
 * are best-effort reconstructions from the documented revert conditions
 * (e.g. "reverts with InvalidSupplyCap if newCap is below current
 * totalSupply or above type(uint128).max" implies two uint256 args).
 *
 * If an arg type here is wrong, the computed 4-byte selector won't match
 * the real one and decodeErrorResult will simply fail to recognize it —
 * that's a safe failure mode (falls back to showing the raw selector),
 * not a wrong diagnosis. Update the corresponding entry here once you
 * observe a real revert and confirm the actual signature.
 */
export const b20ErrorsAbi = [
  {
    type: "error",
    name: "FeatureNotActivated",
    inputs: [{ name: "feature", type: "bytes32" }],
  },
  {
    type: "error",
    name: "TokenAlreadyExists",
    inputs: [{ name: "token", type: "address" }],
  },
  { type: "error", name: "AbiDecodeFailed", inputs: [] },
  {
    type: "error",
    name: "InvalidSupplyCap",
    inputs: [
      { name: "newSupplyCap", type: "uint256" },
      { name: "totalSupply", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "SupplyCapExceeded",
    inputs: [
      { name: "attempted", type: "uint256" },
      { name: "cap", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "PolicyForbids",
    inputs: [
      { name: "policyId", type: "uint64" },
      { name: "account", type: "address" },
    ],
  },
  { type: "error", name: "LastAdminCannotRenounce", inputs: [] },
  {
    type: "error",
    name: "AccessControlUnauthorizedAccount",
    inputs: [
      { name: "account", type: "address" },
      { name: "neededRole", type: "bytes32" },
    ],
  },
  { type: "error", name: "InvalidDecimals", inputs: [{ name: "decimals", type: "uint8" }] },
  { type: "error", name: "InvalidCurrency", inputs: [] },
  { type: "error", name: "InternalCallFailed", inputs: [] },
] as const;

/** IB20.sol — only the entry points this app calls on a deployed token. */
export const b20TokenAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "burnBlocked",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "grantRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateSupplyCap",
    stateMutability: "nonpayable",
    inputs: [{ name: "newSupplyCap", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "updatePolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyScope", type: "bytes32" },
      { name: "newPolicyId", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  // Standard ERC-20 reads — B20 is a superset of ERC-20 (same selectors),
  // so these work against any deployed B20 token exactly like a normal
  // ERC-20 contract. Used by the token lookup tool.
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** IActivationRegistry.sol */
export const activationRegistryAbi = [
  {
    type: "function",
    name: "isActivated",
    stateMutability: "view",
    inputs: [{ name: "feature", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
