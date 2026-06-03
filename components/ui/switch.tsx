export function Switch({ checked }: { checked: boolean }) {
  return (
    <div
      className={`relative h-5 w-11 border border-border ${
        checked ? "bg-primary-strong" : "bg-border"
      }`}
    >
      <div
        className={`absolute top-[1px] h-4 w-4 bg-[#F3F4F6] transition-transform ${
          checked ? "translate-x-[24px] bg-background" : "translate-x-[1px]"
        }`}
      />
    </div>
  );
}
