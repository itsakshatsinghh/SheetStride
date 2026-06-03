import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 items-center justify-center border border-outline bg-surface-dim",
        checked && "border-primary bg-primary text-background",
        className
      )}
    >
      {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
    </div>
  );
}
