import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { settingsData } from "@/lib/mock-data";

function ToggleList({
  title,
  titleColor,
  items
}: {
  title: string;
  titleColor: string;
  items: { label: string; hint: string; enabled: boolean }[];
}) {
  return (
    <Card className="space-y-6 p-6">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className={`font-display text-headline-sm ${titleColor}`}>{title}</h2>
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-body-lg text-text">{item.label}</p>
            <p className="text-[10px] text-muted">{item.hint}</p>
          </div>
          <div className="self-start sm:self-auto">
            <Switch checked={item.enabled} />
          </div>
        </div>
      ))}
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <AppShell className="max-w-[1120px] mx-auto">
      <section className="mb-12">
        <h1 className="font-display text-headline-lg text-text">SYSTEM_PREFERENCES</h1>
        <p className="mt-3 text-body-lg text-muted">
          Configure global workspace parameters and user identity settings.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        <ToggleList title="APPEARANCE" titleColor="text-primary" items={settingsData.appearance} />
        <ToggleList title="NOTIFICATIONS" titleColor="text-secondary" items={settingsData.notifications} />

        <Card className="space-y-6 p-6">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="font-display text-headline-sm text-tertiary">ACCOUNT</h2>
          </div>
          <div>
            <label className="mb-2 block text-label-caps text-muted">DISPLAY NAME</label>
            <input className="sharp-input w-full" defaultValue="Akshat" />
          </div>
          <div>
            <label className="mb-2 block text-label-caps text-muted">EMAIL ADDRESS</label>
            <input className="sharp-input w-full" defaultValue="user@sheetstride.dev" />
          </div>
          <Button variant="primary" className="h-10 w-full">
            UPDATE IDENTITY
          </Button>
        </Card>

        <Card className="space-y-6 p-6">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="font-display text-headline-sm text-danger">PRIVACY & SECURITY</h2>
          </div>
          {settingsData.privacy.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-body-lg text-text">{item.label}</p>
                <p className="text-[10px] text-muted">{item.hint}</p>
              </div>
              <div className="self-start sm:self-auto">
                <Switch checked={item.enabled} />
              </div>
            </div>
          ))}
          <Button className="h-10 w-full">MANAGE TWO-FACTOR AUTH</Button>
        </Card>

        <Card className="space-y-8 p-6 md:col-span-2">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center border border-outline bg-[#282A2C]">
                <div className="h-6 w-6 rounded-full border-2 border-primary" />
              </div>
              <div>
                <h2 className="font-display text-headline-sm">LOCAL DATA STORAGE</h2>
                <p className="text-body-lg text-muted">
                  Manage your encrypted offline database nodes.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-4 sm:w-auto sm:grid-cols-2">
              <Button className="w-full sm:min-w-[144px]">EXPORT JSON</Button>
              <Button variant="danger" className="w-full sm:min-w-[172px]">
                PURGE ALL DATA
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
            {settingsData.storage.map((item) => (
              <div key={item.label} className="border border-border bg-surface-dim p-4">
                <p className="text-[10px] text-muted">{item.label}</p>
                <p
                  className={`mt-2 font-data text-data-md ${
                    item.tone === "primary"
                      ? "text-primary"
                      : item.tone === "secondary"
                        ? "text-secondary"
                        : item.tone === "tertiary"
                          ? "text-tertiary"
                          : "text-text"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <footer className="mt-16 border-t border-outline pt-8 text-center">
        <p className="font-data text-data-md tracking-[0.3em] text-border opacity-50">
          SHEETSTRIDE // TERMINAL SETTINGS // 0X44A2
        </p>
      </footer>
    </AppShell>
  );
}
