import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { FileText, FlaskConical, Settings2, UserRoundSearch, ClipboardList } from "lucide-react";
import { UserButton, useCurrentUserState } from "@/lib/auth/gates";
import { getCurrentLab, getLabDashboardStats } from "@/lib/lab-access";

export const Route = createFileRoute("/lab")({
  loader: async () => Promise.all([getCurrentLab(), getLabDashboardStats()]).then(([lab, stats]) => ({ lab, stats })),
  component: LabDashboard,
});

function LabDashboard() {
  const { user, isPending } = useCurrentUserState();
  const { lab, stats } = Route.useLoaderData();

  if (isPending) return <main className="grid min-h-screen place-items-center bg-paper">جارٍ التحقق…</main>;
  if (!user) return <Navigate to="/login" />;
  if (!lab.is_profile_complete) return <Navigate to="/lab/setup" />;

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Medical Laboratory</p>
            <h1 className="mt-1 font-display text-xl font-semibold">{lab.lab_name} 🧪</h1>
          </div>
          <UserButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl bg-ink p-6 text-paper sm:p-8">
          <p className="text-sm text-paper/60">مرحبًا بك</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">لوحة المعمل</h2>
          <p className="mt-3 text-sm leading-7 text-paper/65">
            المستخدم: <strong className="text-paper">{lab.username}</strong> · الصلاحية: <strong className="text-paper">{roleLabel(lab.role)}</strong>
          </p>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="إجمالي المرضى" value={stats.patients} icon="👥" />
          <StatCard label="تقارير اليوم" value={stats.reportsToday} icon="🧾" />
          <StatCard label="تحت المراجعة" value={stats.pendingReview} icon="🔎" emphasis={stats.pendingReview > 0} />
          <StatCard label="تقارير معتمدة" value={stats.approved} icon="✅" />
          <StatCard label="نتائج حرجة" value={stats.critical} icon="🚨" emphasis={stats.critical > 0} />
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lab.role !== "viewer" ? <Link to="/new" className="rounded-xl border border-line bg-elevated p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><FlaskConical className="size-5" /></div>
            <h3 className="mt-4 font-semibold">تقرير جديد</h3>
            <p className="mt-1 text-sm text-muted">إدخال بيانات المريض واختيار التحاليل.</p>
          </Link> : null}
          <Link to="/patients" className="rounded-xl border border-line bg-elevated p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><UserRoundSearch className="size-5" /></div>
            <h3 className="mt-4 font-semibold">المرضى</h3>
            <p className="mt-1 text-sm text-muted">البحث عن المرضى والرجوع لتقاريرهم السابقة.</p>
          </Link>
          <Link to="/catalog" className="rounded-xl border border-line bg-elevated p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><ClipboardList className="size-5" /></div>
            <h3 className="mt-4 font-semibold">كتالوج التحاليل</h3>
            <p className="mt-1 text-sm text-muted">الوحدات والمدى الطبيعي وتفعيل التحاليل.</p>
          </Link>
          <Link to="/reports" className="rounded-xl border border-line bg-elevated p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><FileText className="size-5" /></div>
            <h3 className="mt-4 font-semibold">التقارير</h3>
            <p className="mt-1 text-sm text-muted">أرشيف التقارير الخاصة بالمعمل.</p>
          </Link>
{lab.role === "owner" ? <Link to="/settings" className="rounded-xl border border-line bg-elevated p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><Settings2 className="size-5" /></div>
            <h3 className="mt-4 font-semibold">بيانات المعمل</h3>
            <p className="mt-1 text-sm text-muted">إعدادات الاسم وبيانات التواصل.</p>
          </Link> : null}
        </div>

        <section className="mt-8 rounded-xl border border-line bg-elevated p-6">
          <h3 className="font-display text-lg font-semibold">ملخص سريع</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            راقب التقارير التي تحتاج مراجعة والنتائج الحرجة من نفس الصفحة، مع بقاء بيانات المعمل معزولة عن أي معمل آخر.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, emphasis = false }: { label: string; value: number; icon: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border bg-elevated p-4 ${emphasis ? "border-amber-300" : "border-line"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <span className="font-display text-2xl font-semibold">{value}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{label}</p>
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "owner") return "مالك المعمل";
  if (role === "technician") return "فني معمل";
  if (role === "reviewer") return "مراجع";
  if (role === "viewer") return "مشاهد";
  return role;
}
