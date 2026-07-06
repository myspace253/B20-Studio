import { NextResponse, type NextRequest } from "next/server";
import { generateNonce } from "siwe";
import { cookies } from "next/headers";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(`nonce:${getClientIp(req)}`, 20, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

  const nonce = generateNonce();
  const cookieStore = await cookies();

  cookieStore.set("siwe-nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes to complete the sign-in
    path: "/",
  });

  return new NextResponse(nonce);
}
