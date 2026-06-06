"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { navIcons } from "@/components/icons";

import { useAuth } from "@/components/providers/auth-provider";

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-outline bg-surface-dim pt-6 pb-4 lg:flex">
      <div className="px-6 pb-10">
        <div className="font-display text-headline-sm text-primary">SHEETSTRIDE_</div>
        <div className="mt-1 text-[10px] text-muted">v1.0.4</div>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = navIcons[item.label];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-0 flex items-center gap-4 px-6 py-4 text-body-lg text-muted transition-colors hover:bg-[#323537] hover:text-text",
                active && "border-l-4 border-primary-strong bg-[#323537] pl-5 text-primary"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-6">
        <button onClick={handleLogout} className="flex items-center gap-4 py-4 text-body-lg text-muted transition-colors hover:text-text">
          <LogOut className="h-6 w-6" strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
