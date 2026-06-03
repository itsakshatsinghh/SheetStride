import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  topbar,
  gridBackground = false
}: {
  children: React.ReactNode;
  className?: string;
  topbar?: React.ReactNode;
  gridBackground?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background text-text">
      <Sidebar />
      {topbar}
      <main
        className={cn(
          "min-h-screen px-margin-mobile pb-24 pt-24 lg:ml-64 lg:px-margin-desktop lg:pb-12",
          gridBackground && "terminal-grid",
          className
        )}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
