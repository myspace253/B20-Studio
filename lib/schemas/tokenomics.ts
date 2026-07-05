import { z } from "zod";

export const tokenomicsSchema = z
  .object({
    treasury: z.coerce.number().min(0).max(100),
    team: z.coerce.number().min(0).max(100),
    community: z.coerce.number().min(0).max(100),
    liquidity: z.coerce.number().min(0).max(100),
    airdrop: z.coerce.number().min(0).max(100),
    reserve: z.coerce.number().min(0).max(100),
  })
  .refine(
    (data) => {
      const total =
        data.treasury +
        data.team +
        data.community +
        data.liquidity +
        data.airdrop +
        data.reserve;
      return Math.abs(total - 100) < 0.01;
    },
    { message: "Allocations must add up to 100%", path: ["treasury"] }
  );

export type TokenomicsFormValues = z.infer<typeof tokenomicsSchema>;
