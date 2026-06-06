import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  className
}: {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex h-5 w-5 items-center justify-center border border-outline bg-surface-dim focus:outline-none focus:ring-1 focus:ring-primary-strong transition-all",
        checked && "border-primary bg-primary text-background",
        className
      )}
    >
      {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
    </button>
  );
}
