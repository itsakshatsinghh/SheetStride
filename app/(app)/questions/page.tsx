import { FolderOpen, Plus, Search, Bell, ArrowRight, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Topbar } from "@/components/app/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { questionSections } from "@/lib/mock-data";

function FilterPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 border border-outline bg-surface-dim px-4 py-2">
      <span className="text-label-caps uppercase text-muted">{label}:</span>
      <span className="text-body-lg text-text">{value}</span>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <AppShell
      className="px-0 pt-0 lg:px-0"
      topbar={<Topbar searchPlaceholder="Search questions..." />}
    >
      <div className="max-w-shell mx-auto pb-12 pt-24 lg:pt-24">
        <section className="mb-10 flex flex-wrap items-center justify-between gap-4 px-6">
          <div className="flex flex-wrap gap-3">
            <FilterPill label="TOPIC" value="All Topics" />
            <FilterPill label="DIFFICULTY" value="All" />
            <FilterPill label="STATUS" value="All" />
          </div>
          <Button variant="primary" size="lg" className="gap-3 px-8 uppercase">
            <Plus className="h-4 w-4" />
            NEW QUESTION
          </Button>
        </section>

        <div className="space-y-14 px-6">
          {questionSections.map((section) => (
            <section key={section.id}>
              <div className="mb-5 flex items-center gap-4">
                <h2
                  className={`font-display text-headline-sm ${
                    section.tone === "secondary"
                      ? "text-secondary"
                      : section.tone === "tertiary"
                        ? "text-tertiary"
                        : section.tone === "danger"
                          ? "text-danger"
                          : "text-primary"
                  }`}
                >
                  {section.id}
                </h2>
                <div className="h-px flex-1 bg-outline/30" />
                <span className="font-data text-data-md text-muted">{section.count}</span>
              </div>

              {section.type === "table" ? (
                <Card className="overflow-hidden bg-[#1d2022]">
                  <div className="grid grid-cols-[48px_1fr_120px_140px_48px] border-b border-outline bg-surface-dim px-4 py-4 text-label-caps text-muted">
                    <div />
                    <div>NAME</div>
                    <div>DIFFICULTY</div>
                    <div>TOPIC</div>
                    <div />
                  </div>
                  <div>
                    {section.rows.map((row) => (
                      <div
                        key={row.name}
                        className="grid grid-cols-[48px_1fr_120px_140px_48px] items-center border-b border-outline/30 px-4 py-6 hover:bg-[#282A2C]"
                      >
                        <div className="flex justify-center">
                          <Checkbox checked={row.checked} />
                        </div>
                        <div className="text-body-lg text-text">{row.name}</div>
                        <div>
                          <Badge
                            tone={
                              row.difficulty === "EASY"
                                ? "secondary"
                                : row.difficulty === "MEDIUM"
                                  ? "tertiary"
                                  : "danger"
                            }
                          >
                            {row.difficulty}
                          </Badge>
                        </div>
                        <div>
                          <Badge tone="neutral">{row.topic}</Badge>
                        </div>
                        <div className="flex justify-end text-muted">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {section.type === "cards" ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  {section.rows.map((row) => (
                    <Card key={row.name} className="bg-[#1d2022] p-6 hover:border-primary-strong">
                      <div className="mb-6 flex items-start justify-between">
                        <Badge
                          tone={
                            row.difficulty === "EASY"
                              ? "secondary"
                              : row.difficulty === "MEDIUM"
                                ? "tertiary"
                                : "danger"
                          }
                        >
                          {row.difficulty}
                        </Badge>
                        <Checkbox checked={row.checked} />
                      </div>
                      <h3 className="min-h-[72px] text-body-lg text-[18px] leading-9 text-text">
                        {row.name}
                      </h3>
                      <div className="mt-8 flex items-center justify-between">
                        <span className="text-label-caps text-muted">TOPIC: {row.topic}</span>
                        <ArrowRight className="h-6 w-6 text-muted" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : null}

              {section.type === "empty" ? (
                <Card className="flex flex-col items-center justify-center bg-[#1d2022] px-8 py-14 text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center border border-outline bg-surface-dim">
                    <FolderOpen className="h-8 w-8 text-outline" strokeWidth={1.6} />
                  </div>
                  <p className="text-body-lg text-text">View remaining Backtracking questions</p>
                  <Button className="mt-6 px-8 uppercase text-primary border-primary hover:bg-primary/10">
                    EXPAND COLLECTION
                  </Button>
                </Card>
              ) : null}
            </section>
          ))}
        </div>

        <footer className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-outline bg-surface py-6 px-6 md:flex-row">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-label-caps text-muted">SYSTEM ONLINE</span>
            </div>
            <span className="text-label-caps text-muted">LAST SYNC: 12:44:01 GMT</span>
          </div>
          <span className="text-label-caps text-muted">SHEETSTRIDE QUESTION ENGINE V2.4.0</span>
        </footer>

        <div className="pointer-events-none fixed bottom-10 right-10 hidden rotate-90 font-data text-data-lg text-primary opacity-10 xl:block">
          EXECUTE_SUCCESS
        </div>
      </div>
    </AppShell>
  );
}
