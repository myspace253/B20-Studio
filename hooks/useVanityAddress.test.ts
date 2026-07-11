import { describe, it, expect } from "vitest";
import { estimateVanityAttempts } from "./useVanityAddress";

describe("estimateVanityAttempts", () => {
  it("computes 16^n for each suffix length — one hex char is a 1-in-16 shot", () => {
    expect(estimateVanityAttempts(1)).toBe(16);
    expect(estimateVanityAttempts(2)).toBe(256);
    expect(estimateVanityAttempts(3)).toBe(4096);
    expect(estimateVanityAttempts(4)).toBe(65536);
    expect(estimateVanityAttempts(6)).toBe(16777216);
  });
});
