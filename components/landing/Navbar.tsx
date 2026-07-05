import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 md:px-12">
      <Link href="/" className="font-display text-lg text-white">
        Base Studio
      </Link>
      <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
    </header>
  );
}
