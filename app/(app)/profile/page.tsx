import { AppShell } from "@/components/app/shell";
import { Topbar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { profileData } from "@/lib/mock-data";

export default function ProfilePage() {
  return (
    <AppShell
      className="terminal-grid"
      topbar={<Topbar showSearchField={false} commandLabel="CMD + K" />}
      gridBackground
    >
      <div className="scanline" />
      <div className="max-w-shell mx-auto">
        <section className="mb-6 grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <Card className="relative overflow-hidden p-8 lg:col-span-8">
            <div className="absolute right-4 top-4 font-data text-data-lg text-primary opacity-10">
              ID_00824
            </div>
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <div className="relative">
                <img
                  alt="Akshat"
                  className="h-40 w-40 border border-border object-cover grayscale"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSqeImMJ0PbBZDFvXnOPg5QTVg2dFY2BI-FHSCWTwRiq1bQD4zSD4CUoUi4-frsSafy--QWYZ7ZOdIiRn_Qj8YwUO9Xsa7RzgG50cgycKqjCqTbVMgmFJWLF8b954Da-GJoJZ1Qwat9cr_ARh0g1296iPovIUJkoLgClElAjleVevFUBVpJLpNPc_ZLlYRX17ouH-g-QPJrkHKvBuWU3XrkgHjYMCS-NyyatQOe0rUFAZYqZigHNCK0zVOV4CCAv2adHU_JuXtbZM"
                />
                <div className="absolute -bottom-3 -right-3 bg-secondary px-3 py-3 text-[8px] text-background">
                  LEVEL 42
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display text-display-hero uppercase text-primary">
                  {profileData.name}
                </h1>
                <p className="mt-4 text-body-lg text-muted">{profileData.joined}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
                  {profileData.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`border border-border bg-[#282A2C] px-4 py-2 text-label-caps ${
                        tag.tone === "secondary"
                          ? "text-secondary"
                          : tag.tone === "tertiary"
                            ? "text-tertiary"
                            : "text-primary"
                      }`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:col-span-4">
            <Card className="p-6">
              <p className="text-label-caps text-muted">TOTAL SOLVED</p>
              <h2 className="mt-4 font-data text-data-lg text-primary">{profileData.totalSolved}</h2>
              <div className="mt-4 h-1 bg-border">
                <div className="h-full w-[78%] bg-primary" />
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-label-caps text-muted">STREAK</p>
              <h2 className="mt-4 font-data text-[56px] leading-none text-secondary">
                {profileData.streak}
              </h2>
              <p className="mt-2 text-[9px] text-secondary">PERSONAL BEST</p>
            </Card>
            <Card className="col-span-2 p-6">
              <p className="mb-4 text-label-caps text-muted">FAVORITE TOPIC</p>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body-lg text-[18px] leading-9 text-text">
                    {profileData.favoriteTopic}
                  </h3>
                  <p className="text-[10px] text-muted">{profileData.favoriteTopicSolved}</p>
                </div>
                <span className="text-muted">&gt;</span>
              </div>
            </Card>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="font-display text-headline-sm">UNLOCKED_ACHIEVEMENTS</h2>
            <div className="h-px flex-1 bg-outline" />
          </div>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {profileData.achievements.map((achievement) => (
              <Card key={achievement.title} className="bg-surface-dim p-8 text-center hover:border-primary-strong">
                <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-[#323537]" />
                <h3 className="text-body-lg font-bold uppercase leading-10">{achievement.title}</h3>
                <p className="mt-4 text-[10px] leading-7 text-muted">{achievement.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-4">
            <h2 className="font-display text-headline-sm">ACTIVITY_LOG</h2>
            <div className="h-px flex-1 bg-outline" />
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead className="border-b border-outline bg-surface-dim">
                <tr>
                  <th className="p-4 text-label-caps text-muted">TIMESTAMP</th>
                  <th className="p-4 text-label-caps text-muted">EVENT_TYPE</th>
                  <th className="p-4 text-label-caps text-muted">DESCRIPTION</th>
                  <th className="p-4 text-right text-label-caps text-muted">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {profileData.log.map((row) => (
                  <tr key={row.timestamp} className="border-b border-border hover:bg-surface-dim/80">
                    <td className="p-4 text-body-md text-muted">{row.timestamp}</td>
                    <td className="p-4">
                      <span
                        className={`${
                          row.tone === "secondary"
                            ? "text-secondary"
                            : row.tone === "tertiary"
                              ? "text-tertiary"
                              : "text-primary"
                        }`}
                      >
                        {row.event}
                      </span>
                    </td>
                    <td className="p-4 text-body-lg text-text">{row.description}</td>
                    <td
                      className={`p-4 text-right text-label-caps ${
                        row.tone === "secondary"
                          ? "text-secondary"
                          : row.tone === "tertiary"
                            ? "text-tertiary"
                            : "text-primary"
                      }`}
                    >
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-outline bg-surface-dim p-4 text-center text-label-caps text-primary">
              LOAD FULL LOG CLUSTER...
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
