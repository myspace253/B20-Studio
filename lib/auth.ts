import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { cookies } from "next/headers";

declare module "next-auth" {
  interface Session {
    address?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (
            typeof credentials?.message !== "string" ||
            typeof credentials?.signature !== "string"
          ) {
            return null;
          }

          const siwe = new SiweMessage(credentials.message);
          const cookieStore = await cookies();
          const nonce = cookieStore.get("siwe-nonce")?.value;

          if (!nonce) {
            // Nonce missing or already consumed — reject rather than
            // skip the check, since that would allow signature replay.
            return null;
          }

          const result = await siwe.verify({
            signature: credentials.signature,
            nonce,
          });

          if (!result.success) return null;

          // One-time use: clear the nonce so the same signed message
          // can't be replayed to sign in again.
          cookieStore.delete("siwe-nonce");

          return { id: siwe.address, address: siwe.address };
        } catch (err) {
          console.error("SIWE authorize failed", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user && "address" in user) {
        token.address = (user as { address: string }).address;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.address === "string") {
        session.address = token.address;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
