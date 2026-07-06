import { z } from "zod";

const decimalString = z
  .string()
  .min(1, "Required")
  .regex(/^[0-9]+$/, "Whole numbers only, no commas or decimals");

export const supplySchema = z
  .object({
    variant: z.enum(["asset", "stablecoin"]),
    initialSupply: decimalString,
    maximumSupply: decimalString.optional().or(z.literal("")),
    // B20Constants.MIN_ASSET_DECIMALS / MAX_ASSET_DECIMALS = 6 / 18 — this
    // is an on-chain constraint (InvalidDecimals revert), not just a UI
    // default, so the floor is 6 even for the asset variant.
    decimals: z.coerce.number().int().min(6).max(18),
    currency: z
      .string()
      .regex(/^[A-Z]+$/, "Uppercase letters only (e.g. USD)")
      .optional()
      .or(z.literal("")),
    mintable: z.boolean(),
    burnable: z.boolean(),
    pausable: z.boolean(),
  })
  .refine(
    (data) =>
      !data.maximumSupply ||
      BigInt(data.maximumSupply) >= BigInt(data.initialSupply),
    {
      message: "Maximum supply must be greater than or equal to initial supply",
      path: ["maximumSupply"],
    }
  )
  .refine((data) => data.variant !== "stablecoin" || data.decimals === 6, {
    message: "Stablecoin variant fixes decimals to 6 on Base",
    path: ["decimals"],
  })
  .refine((data) => data.variant !== "stablecoin" || !!data.currency, {
    message: "Stablecoins need a currency code (e.g. USD)",
    path: ["currency"],
  });

export type SupplyFormValues = z.infer<typeof supplySchema>;
