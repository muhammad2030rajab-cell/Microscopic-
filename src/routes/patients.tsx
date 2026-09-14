import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { searchLabPatients } from "@/lib/patients";
import { formatArDate } from "@/lib/utils";

export const Route = createFileRoute("/patients")({ component: PatientsPage });

function PatientsPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<Awaited<ReturnType<typeof searchLabPatients>>>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (q.trim().length < 2) return;
    setLoading(true);
    try { setPatients(await searchLabPatients({ data: { query: q } })); } finally { setLoading(false); }
  }

  return <AppShell>
    <header className="mb-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">قاعدة المرضى</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">المرضى</h1>
      <p className="mt-2 text-sm text-muted">ابحث عن مريض وشاهد عدد تقاريره السابقة ثم استخدم بياناته عند إنشاء تقرير جديد.</p>
    </header>
    <div className="flex gap-2">
      <div className="relative flex-1"><Search className="pointer-events-none absolute top-3.5 start-3 size-4 text-muted" /><Input className="ps-9" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void search(); }} placeholder="الاسم، الكود، الهاتف أو الرقم القومي" /></div>
      <button type="button" onClick={() => void search()} disabled={loading || q.trim().length < 2} className="rounded-md bg-ink px-5 text-sm font-medium text-paper disabled:opacity-50">{loading ? "بحث…" : "بحث"}</button>
    </div>
    <div className="mt-5 divide-y divide-line overflow-hidden rounded-lg border border-line bg-elevated">
      {patients.map((p) => <div key={p.id} className="flex items-center gap-3 px-4 py-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-teal/10 text-teal"><UserRound className="size-5" /></div>
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.fullName}</p><p className="text-xs text-muted">{p.patientCode || "بدون كود"} · {p.age || "-"} سنة · {p.gender} · {p.reportCount} تقرير</p><p className="text-xs text-muted">{p.phone || "لا يوجد هاتف"}{p.lastReportAt ? ` · آخر تقرير ${formatArDate(p.lastReportAt)}` : ""}</p></div>
        <Link to="/new" className="rounded-md border border-line px-3 py-2 text-xs font-medium hover:bg-paper-2">تقرير جديد</Link>
      </div>)}
      {!patients.length ? <p className="px-4 py-12 text-center text-sm text-muted">اكتب اسم المريض أو جزءًا منه ثم اضغط بحث.</p> : null}
    </div>
  </AppShell>;
}
