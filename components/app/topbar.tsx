import { Bell, Search } from "lucide-react";

export function Topbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  commandLabel = "CMD + K",
  showSearchField = true,
  userAvatarUrl
}: {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  commandLabel?: string;
  showSearchField?: boolean;
  userAvatarUrl?: string;
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline bg-surface px-6 lg:left-64">
      <div className="flex flex-1 items-center gap-4">
        {showSearchField ? (
          <div className="relative w-full max-w-[520px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="h-10 w-full border border-outline bg-surface-dim pl-12 pr-4 text-body-lg text-text outline-none placeholder:text-muted focus:border-primary-strong"
              placeholder={searchPlaceholder ?? commandLabel}
              value={searchValue || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        ) : (
          <div className="hidden items-center gap-2 border border-outline bg-[#282A2C] px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-muted" />
            <span className="text-label-caps text-muted">{commandLabel}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-5">
        <Bell className="h-6 w-6 text-primary" strokeWidth={1.8} />
        {userAvatarUrl ? (
          <img
            alt="User Profile"
            className="h-9 w-9 border border-primary object-cover grayscale hover:grayscale-0 transition-all"
            src={userAvatarUrl}
          />
        ) : (
          <div className="h-9 w-9 border border-primary bg-surface-dim flex items-center justify-center font-display text-primary text-body-md font-bold">
            S_
          </div>
        )}
      </div>
    </header>
  );
}
