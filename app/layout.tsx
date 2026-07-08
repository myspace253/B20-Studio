import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { SessionAuthProvider } from "@/components/providers/SessionAuthProvider";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "Base Studio — Create B20 Tokens in under 60 seconds",
  description:
    "The easiest way to create, deploy, manage, and analyze B20 tokens on Base. Protocol-native issuance for stablecoins, RWAs, and long-tail tokens.",
  openGraph: {
    title: "Base Studio",
    description:
      "The easiest way to create, deploy, manage, and analyze B20 tokens on Base.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Base Studio",
    description:
      "The easiest way to create, deploy, manage, and analyze B20 tokens on Base.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SessionAuthProvider>
          <Web3Provider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </Web3Provider>
        </SessionAuthProvider>
      </body>
    </html>
  );
}
