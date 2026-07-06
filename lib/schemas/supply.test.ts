import { describe, it, expect } from "vitest";
import { supplySchema } from "./supply";

const base = {
  variant: "asset" as const,
  initialSupply: "1000000",
  decimals: 18,
  mintable: true,
  burnable: true,
  pausable: false,
};

describe("supplySchema", () => {
  it("accepts a valid asset configuration", () => {
    expect(supplySchema.safeParse(base).success).toBe(true);
  });

  it("rejects a maximum supply below the initial supply", () => {
    const result = supplySchema.safeParse({
      ...base,
      initialSupply: "1000",
      maximumSupply: "500",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.maximumSupply).toBeDefined();
    }
  });

  it("accepts a maximum supply equal to the initial supply", () => {
    const result = supplySchema.safeParse({
      ...base,
      initialSupply: "1000",
      maximumSupply: "1000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects stablecoins with decimals other than 6", () => {
    const result = supplySchema.safeParse({
      ...base,
      variant: "stablecoin",
      decimals: 18,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.decimals).toBeDefined();
    }
  });

  it("accepts stablecoins with exactly 6 decimals and a currency code", () => {
    const result = supplySchema.safeParse({
      ...base,
      variant: "stablecoin",
      decimals: 6,
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects stablecoins missing a currency code", () => {
    const result = supplySchema.safeParse({
      ...base,
      variant: "stablecoin",
      decimals: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects asset decimals below the on-chain floor of 6", () => {
    const result = supplySchema.safeParse({ ...base, decimals: 4 });
    expect(result.success).toBe(false);
  });

  it("rejects supply strings with decimal points or commas", () => {
    const result = supplySchema.safeParse({ ...base, initialSupply: "1,000.5" });
    expect(result.success).toBe(false);
  });
});
