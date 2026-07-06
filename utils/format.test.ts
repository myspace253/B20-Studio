import { describe, it, expect } from "vitest";
import { truncateAddress, formatTokenAmount, formatPercent } from "./format";

describe("truncateAddress", () => {
  it("shortens a standard EVM address", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678"
    );
  });

  it("returns short strings unchanged", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });

  it("respects a custom character count", () => {
    expect(
      truncateAddress("0x1234567890abcdef1234567890abcdef12345678", 6)
    ).toBe("0x123456…345678");
  });
});

describe("formatTokenAmount", () => {
  it("formats a whole-number raw amount with no fractional part", () => {
    expect(formatTokenAmount("1000000000000000000", 18)).toBe("1");
  });

  it("formats a fractional amount, trimming trailing zeros", () => {
    expect(formatTokenAmount("1500000000000000000", 18)).toBe("1.5");
  });

  it("adds thousands separators to the whole part", () => {
    expect(formatTokenAmount("1234000000", 6)).toBe("1,234");
  });

  it("accepts a bigint directly", () => {
    expect(formatTokenAmount(500n, 2)).toBe("5");
  });

  it("handles zero decimals (whole-unit tokens)", () => {
    expect(formatTokenAmount("42", 0)).toBe("42");
  });
});

describe("formatPercent", () => {
  it("drops the decimal point for whole percentages", () => {
    expect(formatPercent(20)).toBe("20%");
  });

  it("keeps one decimal place for fractional percentages", () => {
    expect(formatPercent(33.333)).toBe("33.3%");
  });
});
