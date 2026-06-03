import { cn } from "@/lib/utils";

export function Heatmap({
  columns = 52,
  rows = 7,
  mode = "dashboard"
}: {
  columns?: number;
  rows?: number;
  mode?: "dashboard" | "progress";
}) {
  const values = Array.from({ length: columns * rows }, (_, index) => {
    const seed = (index * 17 + 31) % 10;
    return mode === "progress" ? seed % 5 : seed < 6 ? seed % 2 : seed % 5;
  });

  const colors =
    mode === "dashboard"
      ? ["bg-[#151515]", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary"]
      : ["bg-outline/20", "bg-primary/40", "bg-primary/60", "bg-primary/80", "bg-primary"];

  return (
    <div className={cn(mode === "dashboard" ? "flex gap-1 min-w-[700px]" : "grid grid-cols-12 gap-1.5")}>
      {mode === "dashboard"
        ? Array.from({ length: columns }).map((_, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-1">
              {Array.from({ length: rows }).map((__, rowIndex) => {
                const value = values[columnIndex * rows + rowIndex];
                return (
                  <div
                    key={`${columnIndex}-${rowIndex}`}
                    className={cn("h-3 w-3 border border-background/20", colors[value])}
                  />
                );
              })}
            </div>
          ))
        : values.map((value, index) => (
            <div key={index} className={cn("aspect-square w-full", colors[value])} />
          ))}
    </div>
  );
}
