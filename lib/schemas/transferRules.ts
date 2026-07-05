import { z } from "zod";

export const transferRuleTypes = [
  { value: "allow_everyone", label: "Allow everyone" },
  { value: "whitelist_only", label: "Whitelist only" },
  { value: "blacklist", label: "Blacklist" },
  { value: "country_restrictions", label: "Country restrictions" },
  { value: "kyc_required", label: "KYC required" },
  { value: "max_wallet", label: "Max wallet" },
  { value: "max_transaction", label: "Max transaction" },
] as const;

export const transferRulesSchema = z
  .object({
    type: z.enum([
      "allow_everyone",
      "whitelist_only",
      "blacklist",
      "country_restrictions",
      "kyc_required",
      "max_wallet",
      "max_transaction",
    ]),
    value: z.string().optional(),
  })
  .refine(
    (data) =>
      !["max_wallet", "max_transaction", "country_restrictions"].includes(
        data.type
      ) || !!data.value,
    { message: "This rule needs a value", path: ["value"] }
  );

export type TransferRulesFormValues = z.infer<typeof transferRulesSchema>;
