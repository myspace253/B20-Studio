"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV_SECTIONS = [
  {
    label: "Tokens",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/create", label: "Create token" },
      { href: "/dashboard/tokens", label: "My tokens" },
      { href: "/dashboard/lookup", label: "Look up" },
      { href: "/dashboard/templates", label: "Templates" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/dashboard/analytics", label: "Analytics" },
      { href: "/dashboard/activity", label: "Transaction history" },
    ],
  },
  {
    label: "",
    items: [{ href: "/dashboard/settings", label: "Settings" }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-8 border-r border-line bg-surface px-4 py-8">
      <Link href="/" className="px-2 font-display text-lg text-white">
        Base Studio
      </Link>

      {NAV_SECTIONS.map((section, i) => (
        <div key={section.label || i}>
          {section.label && (
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-fog">
              {section.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-sm px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-surface2 text-white"
                        : "text-muted hover:bg-surface2 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
