import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest select-none text-outline/65 mb-6">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-primary transition-colors text-outline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-text font-bold" : ""}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="text-outline/30 font-light">&gt;</span>}
          </div>
        );
      })}
    </nav>
  );
}
