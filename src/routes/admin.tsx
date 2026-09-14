import { type ReactNode } from "react";
import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { Building2, FileText, Settings2, Users } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { isPlatformAdmin } from "@/lib/platform-admin";

export const Route = createFileRoute("/admin")({
  loader: async ({ location }) => ({
    // Keep first-admin bootstrap accessible before any platform admin exists.
    isAdmin: location.pathname === "/admin/setup" ? false : await isPlatformAdmin(),
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === "/admin/setup") return <Outlet />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const { isAdmin } = Route.useLoaderData();

  if (!isAdmin) return <Navigate to="/login" />;

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div><p className="text-[11px] uppercase tracking-[0.2em] text-muted">Central administration</p><h1 className="mt-1 font-display text-xl font-semibold">لوحة تحكم المدير 👑</h1></div>
          <UserButton />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl bg-ink p-6 text-paper sm:p-8">
          <p className="text-sm text-paper/60">Rajab Diagnostics</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">إدارة شبكة المعامل الطبية</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-paper/65">من هنا هنضيف المعامل، ننشئ حسابات المستخدمين، ونتحكم في التقارير والصلاحيات — وكل معمل هيشوف بياناته فقط.</p>
        </section>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/labs"><AdminCard icon={<Building2 />} title="المعامل" description="إضافة وإدارة المعامل" /></Link>
          <Link to="/admin/labs"><AdminCard icon={<Users />} title="المستخدمون" description="حسابات وصلاحيات كل معمل" /></Link>
          <AdminCard icon={<FileText />} title="التقارير" description="متابعة تقارير النظام" />
          <AdminCard icon={<Settings2 />} title="الإعدادات" description="إعدادات النظام المركزية" />
        </div>
        <section className="mt-8 rounded-xl border border-dashed border-line bg-elevated p-6">
          <h3 className="font-display text-lg font-semibold">الخطوة التالية</h3>
          <p className="mt-2 text-sm leading-6 text-muted">هنضيف شاشة <strong>إضافة معمل</strong>، ومنها المدير ينشئ اسم المعمل وبيانات دخوله.</p>
          <Link to="/" className="mt-4 inline-flex text-sm text-teal hover:underline">العودة للنظام</Link>
        </section>
      </div>
    </main>
  );
}

function AdminCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="rounded-xl border border-line bg-elevated p-5"><div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal">{icon}</div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 text-sm text-muted">{description}</p></div>;
}
