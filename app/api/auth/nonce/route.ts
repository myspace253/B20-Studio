import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { cookies } from "next/headers";

export async function GET() {
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
