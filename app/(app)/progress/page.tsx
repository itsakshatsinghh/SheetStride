import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Heatmap } from "@/components/shared/heatmap";
import { progressData } from "@/lib/mock-data";

export default function ProgressPage() {
  return (
    <AppShell className="max-w-shell mx-auto relative" topbar={null}>
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#60A5FA 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />
      <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-headline-lg text-text">ANALYTICS_REPORT</h1>
          <p className="mt-2 text-body-lg text-muted">
            Real-time performance tracking and skill acquisition metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button>EXPORT_PDF</Button>
          <Button variant="primary">RECALCULATE_STATS</Button>
        </div>
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter md:grid-cols-12">
        <Card className="relative overflow-hidden bg-[#191c1e] p-6 md:col-span-8">
          <div className="absolute right-4 top-4 text-primary/10">
            <div className="h-20 w-20 border-[8px] border-current" />
          </div>
          <div className="relative z-10">
            <span className="mb-4 block text-label-caps text-primary">TOTAL_COMPLETION_INDEX</span>
            <div className="mb-6 flex items-end gap-4">
              <span className="font-data text-data-lg leading-none text-text">
                {progressData.completion}
                <span className="text-primary">%</span>
              </span>
              <span className="text-body-lg text-secondary">{progressData.delta}</span>
            </div>
            <div className="mb-5 flex h-10 border border-outline bg-[#323537]">
              <div className="h-full border-r-2 border-surface bg-primary" style={{ width: "45%" }} />
              <div className="h-full border-r-2 border-surface bg-primary" style={{ width: "20%" }} />
              <div className="h-full border-r-2 border-surface bg-primary/60" style={{ width: "10%" }} />
              <div className="h-full bg-[#323537]" style={{ width: "25%" }} />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <p className="mb-1 text-label-caps text-muted">SOLVED</p>
                <p className="font-data text-data-md">{progressData.solved}</p>
              </div>
              <div>
                <p className="mb-1 text-label-caps text-muted">STREAK</p>
                <p className="font-data text-data-md text-tertiary">{progressData.streak}</p>
              </div>
              <div>
                <p className="mb-1 text-label-caps text-muted">AVG_TIME</p>
                <p className="font-data text-data-md">{progressData.avgTime}</p>
              </div>
              <div>
                <p className="mb-1 text-label-caps text-muted">RANKING</p>
                <p className="font-data text-data-md">{progressData.ranking}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col bg-[#191c1e] md:col-span-4">
          <CardHeader className="bg-[#1d2022]">SYSTEM_INSIGHTS</CardHeader>
          <div className="space-y-8 p-6">
            {progressData.insights.map((item) => (
              <div key={item.title}>
                <div className="mb-2 flex items-center gap-2 text-label-caps">
                  <span
                    className={
                      item.tone === "secondary"
                        ? "text-secondary"
                        : item.tone === "danger"
                          ? "text-danger"
                          : "text-primary"
                    }
                  >
                    {item.title}
                  </span>
                </div>
                <p className="text-body-lg text-[18px] leading-9 text-text">{item.value}</p>
                <p
                  className={`text-[10px] ${
                    item.tone === "secondary"
                      ? "text-secondary"
                      : item.tone === "danger"
                        ? "text-danger"
                        : "text-muted"
                  }`}
                >
                  {item.subvalue}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter md:grid-cols-12">
        <Card className="bg-[#191c1e] p-6 md:col-span-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-label-caps text-text">SOLVE_FREQUENCY_7D</h2>
            <div className="flex gap-2">
              <span className="h-4 w-4 bg-primary" />
              <span className="h-4 w-4 bg-secondary" />
            </div>
          </div>
          <div className="flex h-64 items-end justify-between gap-3 px-2">
            {[
              { day: "MON", value: 40, color: "bg-primary/30" },
              { day: "TUE", value: 65, color: "bg-primary/30" },
              { day: "WED", value: 90, color: "bg-primary" },
              { day: "THU", value: 50, color: "bg-primary/30" },
              { day: "FRI", value: 75, color: "bg-primary/30" },
              { day: "SAT", value: 45, color: "bg-secondary" },
              { day: "SUN", value: 30, color: "bg-secondary" }
            ].map((bar) => (
              <div key={bar.day} className="flex flex-1 flex-col items-center gap-3">
                <div className={`w-full ${bar.color}`} style={{ height: `${bar.value}%` }} />
                <span className="text-label-caps text-muted">{bar.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden bg-[#191c1e] p-6 md:col-span-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-label-caps text-text">CONTRIBUTION_MAP</h2>
            <span className="text-label-caps text-muted">YEAR 2024</span>
          </div>
          <Heatmap mode="progress" columns={12} rows={4} />
          <div className="mt-6 flex items-center justify-between text-label-caps text-muted">
            <span>JAN</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="h-2 w-2 bg-outline/20" />
              <div className="h-2 w-2 bg-primary/40" />
              <div className="h-2 w-2 bg-primary/70" />
              <div className="h-2 w-2 bg-primary" />
              <span>More</span>
            </div>
            <span>APR</span>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <Card className="overflow-hidden bg-[#191c1e]">
          <CardHeader className="flex items-center justify-between">
            <span>TOPIC_DISTRIBUTION</span>
            <span className="text-muted">=</span>
          </CardHeader>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline bg-surface">
                <th className="px-6 py-4 text-label-caps text-muted">MODULE</th>
                <th className="px-6 py-4 text-label-caps text-muted">PROGRESS</th>
                <th className="px-6 py-4 text-right text-label-caps text-muted">COUNT</th>
              </tr>
            </thead>
            <tbody>
              {progressData.topicDistribution.map((row) => (
                <tr key={row.label} className="border-b border-outline/30 hover:bg-[#282A2C]">
                  <td className="px-6 py-5 text-body-lg text-text">{row.label}</td>
                  <td className="px-6 py-5">
                    <div className="h-2 border border-outline bg-[#323537]">
                      <div className="h-full bg-primary" style={{ width: `${row.progress}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-data text-data-md">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden bg-[#191c1e]">
          <CardHeader className="flex items-center justify-between">
            <span>DIFFICULTY_BREAKDOWN</span>
            <span className="text-muted">=</span>
          </CardHeader>
          <div className="space-y-10 p-6">
            {progressData.difficulty.map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-end justify-between">
                  <span
                    className={`text-label-caps ${
                      row.tone === "secondary"
                        ? "text-secondary"
                        : row.tone === "tertiary"
                          ? "text-tertiary"
                          : "text-danger"
                    }`}
                  >
                    {row.label}
                  </span>
                  <span className="font-data text-data-md">{row.count}</span>
                </div>
                <div className="h-5 border border-outline bg-[#323537]">
                  <div
                    className={
                      row.tone === "secondary"
                        ? "h-full bg-secondary"
                        : row.tone === "tertiary"
                          ? "h-full bg-tertiary"
                          : "h-full bg-danger"
                    }
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
