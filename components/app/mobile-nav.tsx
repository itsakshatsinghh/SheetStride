"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { navIcons } from "@/components/icons";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 grid h-16 w-full grid-cols-5 border-t border-outline bg-surface-dim lg:hidden">
      {navItems.map((item) => {
        const Icon = navIcons[item.label];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-muted",
              active && "text-primary"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 1.8} />
            <span className="font-body text-[8px] uppercase tracking-[0.1em]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
