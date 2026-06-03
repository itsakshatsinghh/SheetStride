import { CheckCircle2, Trophy, Zap, Waypoints } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Heatmap } from "@/components/shared/heatmap";
import { dashboardData } from "@/lib/mock-data";

const statIcons = [CheckCircle2, Zap, Trophy, Waypoints];

export default function DashboardPage() {
  return (
    <AppShell className="max-w-shell mx-auto">
      <section className="mb-gutter">
        <Card className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="inline-block border border-primary px-2 py-1 text-label-caps uppercase text-primary">
              SYSTEM STATUS: ACTIVE
            </div>
            <h1 className="font-display text-display-hero leading-[1.4] text-text">
              {dashboardData.level}
            </h1>
            <div className="flex items-end gap-4">
              <span className="font-data text-data-lg text-primary">{dashboardData.solved}</span>
              <span className="pb-2 text-body-lg text-muted">PROBLEMS_SOLVED</span>
            </div>
          </div>
          <div className="w-full md:max-w-[370px]">
            <div className="mb-3 flex justify-between text-headline-sm text-muted">
              <span>GLOBAL_PROGRESS</span>
              <span className="text-primary">{dashboardData.progress}%</span>
            </div>
            <div className="relative h-5 overflow-hidden bg-border">
              <div className="h-full bg-primary-strong" style={{ width: `${dashboardData.progress}%` }} />
              <div className="pointer-events-none absolute inset-0 flex justify-between">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-full w-px bg-background/50" />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        {dashboardData.stats.map((stat, index) => {
          const Icon = statIcons[index];
          const tone =
            stat.tone === "secondary"
              ? "group-hover:text-secondary"
              : stat.tone === "tertiary"
                ? "group-hover:text-tertiary"
                : "group-hover:text-primary";
          return (
            <Card key={stat.label} className="group p-6 hover:border-primary-strong">
              <div className="mb-8 flex items-center justify-between">
                <Icon className={`h-6 w-6 text-muted ${tone}`} strokeWidth={1.8} />
                <span className="text-label-caps text-muted">{stat.label}</span>
              </div>
              <div className="font-data text-data-lg leading-none text-text">{stat.value}</div>
              <div className="mt-3 text-body-lg text-muted">{stat.subtext}</div>
            </Card>
          );
        })}
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter xl:grid-cols-3">
        <Card className="xl:col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-headline-sm">CONTRIBUTION_MAP</h2>
            <div className="flex items-center gap-2 text-label-caps text-muted">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 border border-background/20 bg-[#151515]" />
                <div className="h-3 w-3 bg-primary/20" />
                <div className="h-3 w-3 bg-primary/40" />
                <div className="h-3 w-3 bg-primary/60" />
                <div className="h-3 w-3 bg-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
          <div className="overflow-x-auto pb-4">
            <Heatmap mode="dashboard" />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-8 font-display text-headline-sm">DIFFICULTY_LEVELS</h2>
          <div className="space-y-8">
            {dashboardData.difficulty.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between font-display text-headline-sm">
                  <span
                    className={
                      item.tone === "secondary"
                        ? "text-secondary"
                        : item.tone === "tertiary"
                          ? "text-tertiary"
                          : "text-danger"
                    }
                  >
                    {item.label}
                  </span>
                  <span className="text-text">{item.solved}</span>
                </div>
                <div className="h-3 bg-border">
                  <div
                    className={
                      item.tone === "secondary"
                        ? "h-full bg-secondary"
                        : item.tone === "tertiary"
                          ? "h-full bg-tertiary"
                          : "h-full bg-danger"
                    }
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-gutter xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader>TOPIC_MATRICES</CardHeader>
          <div className="grid grid-cols-1 gap-x-12 gap-y-8 p-6 md:grid-cols-2">
            {dashboardData.topics.map((topic) => (
              <div key={topic.name}>
                <div className="mb-2 flex justify-between text-label-caps text-muted">
                  <span>{topic.name}</span>
                  <span>{topic.value}%</span>
                </div>
                <div className="h-1 bg-border">
                  <div className="h-full bg-primary-strong" style={{ width: `${topic.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>RECENT_LOGS</CardHeader>
          <div className="space-y-4 p-4">
            {dashboardData.recentLogs.map((item) => (
              <div
                key={item.title}
                className={`flex items-center gap-3 p-3 hover:bg-[#282A2C] ${
                  item.state === "error" ? "opacity-60" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center border text-[10px] ${
                    item.tone === "secondary"
                      ? "border-secondary text-secondary bg-secondary/10"
                      : item.tone === "tertiary"
                        ? "border-tertiary text-tertiary bg-tertiary/10"
                        : "border-danger text-danger bg-danger/10"
                  }`}
                >
                  {item.difficulty}
                </div>
                <div className="flex-1">
                  <p className="text-body-lg text-text">{item.title}</p>
                  <p className="text-[9px] text-muted">{item.time}</p>
                </div>
                <CheckCircle2
                  className={`h-4 w-4 ${
                    item.state === "error" ? "text-danger" : "text-secondary"
                  }`}
                  strokeWidth={2}
                />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-outline py-8 opacity-50 md:flex-row">
        <p className="text-label-caps">TERMINAL_SESSION_ID: 88A4-5F22-PX11</p>
        <div className="flex gap-6 text-label-caps">
          <span>DOCS</span>
          <span>SUPPORT</span>
          <span>GITHUB</span>
        </div>
      </footer>
    </AppShell>
  );
}
