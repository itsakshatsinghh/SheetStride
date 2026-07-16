import { cn } from "@/lib/utils";

const toneMap = {
  primary: "border-primary text-primary bg-primary/5",
  secondary: "border-secondary text-secondary bg-secondary/5",
  tertiary: "border-tertiary text-tertiary bg-tertiary/5",
  danger: "border-danger text-danger bg-danger/5",
  neutral: "border-outline text-muted bg-[#323537]"
} as const;

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-body text-badge-sm uppercase",
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
