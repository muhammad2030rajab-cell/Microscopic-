import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpLeft, FilePlus2, FlaskConical, TriangleAlert } from "lucide-react";
import { InstallBanner } from "@/components/install-banner";
import { AppShell } from "@/components/layout/app-shell";
import { FlagDot } from "@/components/report/flag-badge";
import { Badge } from "@/components/ui/badge";
import { interpretResult, isCritical } from "@/lib/medical";
import { useLabStore } from "@/lib/store";
import { CATEGORIES, TOTAL_TESTS } from "@/lib/tests-catalog";
import { formatArDate } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const lab = useLabStore((s) => s.lab);
  const reports = useLabStore((s) => s.reports);

  const abnormalReports = reports.filter((r) =>
    r.tests.some((t) => {
      const f = interpretResult(t.name, t.value, r.gender, t.customRange).flag;
      return f === "high" || f === "low" || f === "abnormal";
    }),
  ).length;

  const testsRun = reports.reduce((n, r) => n + r.tests.length, 0);

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-xl border border-line bg-ink px-5 py-7 text-paper sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-teal" />
        <p className="text-[11px] uppercase tracking-[0.22em] text-paper/55">Clinical laboratory</p>
        <h1 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {lab.name}
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-paper/70">
          إصدار تقارير كيمياء حيوية بمراجع حسب الجنس، تفسير فوري، وحسابات تلقائية مثل LDL و eGFR.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/new"
            className="inline-flex h-11 items-center gap-2 rounded-sm bg-teal px-4 text-sm font-medium text-teal-fg"
          >
            <FilePlus2 className="size-4" />
            تقرير جديد
          </Link>
          <Link
            to="/catalog"
            className="inline-flex h-11 items-center gap-2 rounded-sm border border-paper/20 px-4 text-sm text-paper/85 hover:bg-paper/5"
          >
            <FlaskConical className="size-4" />
            دليل التحاليل
          </Link>
        </div>
      </section>

      <InstallBanner />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="تقارير محفوظة" value={String(reports.length)} />
        <Stat label="تحاليل مُدخلة" value={String(testsRun)} />
        <Stat label="تقارير بعلامات" value={String(abnormalReports)} />
        <Stat label="في الدليل" value={`${TOTAL_TESTS}+`} hint={`${CATEGORIES.length} قسماً`} />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">آخر التقارير</h2>
          <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-teal hover:underline">
            عرض الكل
            <ArrowUpLeft className="size-4" />
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            لا توجد تقارير بعد. أنشئ أول تقرير من الزر أعلاه.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-elevated">
            {reports.slice(0, 6).map((r) => {
              const flags = r.tests.map((t) => interpretResult(t.name, t.value, r.gender, t.customRange));
              const bad = flags.filter((f) => f.flag === "high" || f.flag === "low" || f.flag === "abnormal").length;
              const crit = r.tests.some((t) => isCritical(t.name, t.value));
              return (
                <li key={r.id}>
                  <Link
                    to="/reports/$id"
                    params={{ id: r.id }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper-2/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.patientName}</p>
                      <p className="text-xs text-muted">
                        {r.age} {r.gender} · {formatArDate(r.createdAt)} · {r.tests.length} تحليل
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {crit ? (
                        <Badge tone="high">
                          <TriangleAlert className="me-1 size-3" />
                          حرج
                        </Badge>
                      ) : bad > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                          <FlagDot flag="high" />
                          {bad} غير طبيعي
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ok">
                          <FlagDot flag="normal" />
                          ضمن الطبيعي
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-elevated px-4 py-4">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}


