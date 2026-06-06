export function Switch({
  checked,
  onCheckedChange
}: {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={`relative h-5 w-11 border border-border transition-colors focus:outline-none focus:ring-1 focus:ring-primary-strong ${
        checked ? "bg-primary-strong" : "bg-border"
      }`}
    >
      <div
        className={`absolute top-[1px] h-4 w-4 bg-[#F3F4F6] transition-transform ${
          checked ? "translate-x-[24px] bg-background" : "translate-x-[1px]"
        }`}
      />
    </button>
  );
}
