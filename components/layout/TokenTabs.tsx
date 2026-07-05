"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "mint", label: "Mint" },
  { segment: "burn", label: "Burn" },
  { segment: "freeze", label: "Freeze" },
  { segment: "transfer-rules", label: "Transfer rules" },
  { segment: "metadata", label: "Metadata" },
  { segment: "roles", label: "Roles" },
  { segment: "analytics", label: "Analytics" },
  { segment: "activity", label: "Activity" },
];

export function TokenTabs({ tokenId }: { tokenId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/tokens/${tokenId}`;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-line">
      {TABS.map((tab) => {
        const href = `${base}${tab.segment ? `/${tab.segment}` : ""}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "rounded-t-sm border-b-2 px-4 py-2 text-sm transition-colors",
              active
                ? "border-base text-white"
                : "border-transparent text-muted hover:text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
