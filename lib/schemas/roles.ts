import { z } from "zod";
import { isAddress } from "viem";

const evmAddress = z
  .string()
  .min(1, "Required")
  .refine((val) => isAddress(val), "Enter a valid EVM address (0x…)");

export const rolesSchema = z.object({
  owner: evmAddress,
  admin: evmAddress.optional().or(z.literal("")),
  mintRole: evmAddress.optional().or(z.literal("")),
  burnRole: evmAddress.optional().or(z.literal("")),
  freezeRole: evmAddress.optional().or(z.literal("")),
  transferRole: evmAddress.optional().or(z.literal("")),
});

export type RolesFormValues = z.infer<typeof rolesSchema>;
