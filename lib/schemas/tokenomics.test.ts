import { describe, it, expect } from "vitest";
import { tokenomicsSchema } from "./tokenomics";

describe("tokenomicsSchema", () => {
  it("accepts allocations that sum to exactly 100", () => {
    const result = tokenomicsSchema.safeParse({
      treasury: 20,
      team: 10,
      community: 50,
      liquidity: 20,
      airdrop: 0,
      reserve: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects allocations that sum to less than 100", () => {
    const result = tokenomicsSchema.safeParse({
      treasury: 20,
      team: 10,
      community: 30,
      liquidity: 20,
      airdrop: 0,
      reserve: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects allocations that sum to more than 100", () => {
    const result = tokenomicsSchema.safeParse({
      treasury: 50,
      team: 50,
      community: 50,
      liquidity: 0,
      airdrop: 0,
      reserve: 0,
    });
    expect(result.success).toBe(false);
  });

  it("tolerates floating point rounding within the epsilon", () => {
    const result = tokenomicsSchema.safeParse({
      treasury: 33.34,
      team: 33.33,
      community: 33.33,
      liquidity: 0,
      airdrop: 0,
      reserve: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects any single allocation above 100", () => {
    const result = tokenomicsSchema.safeParse({
      treasury: 150,
      team: 0,
      community: 0,
      liquidity: 0,
      airdrop: 0,
      reserve: 0,
    });
    expect(result.success).toBe(false);
  });
});
