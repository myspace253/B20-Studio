import { describe, expect, it } from "vitest";
import { withDatabaseFallback } from "./prisma";

describe("withDatabaseFallback", () => {
  it("returns the provided fallback when the database query throws", async () => {
    const fallback = [] as string[];

    const result = await withDatabaseFallback(async () => {
      throw new Error("db down");
    }, fallback);

    expect(result).toBe(fallback);
  });
});
