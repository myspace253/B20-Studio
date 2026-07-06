import { NextResponse, type NextRequest } from "next/server";

/**
 * In-memory, per-process rate limiting. This is fine for a single server
 * instance but does NOT work across multiple serverless instances or
 * horizontally-scaled deployments — each instance keeps its own counters,
 * so the real limit becomes (yourLimit × instanceCount). For production
 * behind more than one instance, swap this for a shared store (Upstash
 * Redis's @upstash/ratelimit is the standard choice on Vercel).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so this doesn't grow unbounded across
// a long-running process.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  5 * 60 * 1000
).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/**
 * Best-effort client IP extraction. `x-forwarded-for` is set by most
 * proxies/CDNs (including Vercel) but is trivially spoofable if your
 * deployment doesn't strip it at the edge — fine for basic abuse
 * mitigation, not a security boundary on its own.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function tooManyRequests(result: RateLimitResult) {
  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
      },
    }
  );
}
