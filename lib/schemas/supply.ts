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
    decimals: z.coerce.number().int().min(0).max(18),
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
  .refine(
    (data) => data.variant !== "stablecoin" || data.decimals === 6,
    {
      message: "Stablecoin variant fixes decimals to 6 on Base",
      path: ["decimals"],
    }
  );

export type SupplyFormValues = z.infer<typeof supplySchema>;
