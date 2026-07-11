import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-line px-8 py-4">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
