import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, UserPlus, Users, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentLab, type LabProfileData } from "@/lib/lab-access";
import { createLabStaff, listLabStaff, updateLabStaff, type LabRole, type LabStaff } from "@/lib/lab-users";

export const Route = createFileRoute("/team")({
  loader: async () => {
    try {
      const [lab, staff] = await Promise.all([getCurrentLab(), listLabStaff()]);
      return { lab, staff };
    } catch {
      return { lab: null as LabProfileData | null, staff: [] as LabStaff[] };
    }
  },
  component: TeamPage,
});

const roleLabels: Record<Exclude<LabRole, "owner">, string> = {
  technician: "فني معمل",
  reviewer: "مراجع",
  viewer: "مشاهد",
};

function TeamPage() {
  const { lab, staff: initialStaff } = Route.useLoaderData();
  const [staff, setStaff] = useState<LabStaff[]>(initialStaff);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<LabRole, "owner">>("technician");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => setStaff(initialStaff), [initialStaff]);

  if (!lab) return <Navigate to="/login" replace />;
  if (lab.role !== "owner") return <Navigate to="/lab" />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const created = await createLabStaff({ data: { username, name, password, role } });
      setStaff((current) => [
        ...current,
        { id: created.id, username: created.username, name: created.name, role: created.role, isActive: true, createdAt: new Date().toISOString() },
      ]);
      setUsername(""); setName(""); setPassword(""); setRole("technician");
      setSuccess(`تم إنشاء حساب ${created.username} بنجاح`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  async function changeStaff(id: string, patch: { role?: Exclude<LabRole, "owner">; isActive?: boolean }) {
    try {
      await updateLabStaff({ data: { id, ...patch } });
      setStaff((current) => current.map((member) => member.id === id ? { ...member, ...patch } : member));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تعديل الحساب");
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div><p className="text-[11px] uppercase tracking-[0.2em] text-muted">Laboratory team</p><h1 className="mt-1 font-display text-xl font-semibold">مستخدمو المعمل 👥</h1></div>
          <Link to="/lab" className="inline-flex items-center gap-2 text-sm text-teal hover:underline"><ArrowRight className="size-4" /> لوحة المعمل</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl bg-ink p-6 text-paper sm:p-8">
          <p className="text-sm text-paper/60">{lab.lab_name}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">إدارة فريق المعمل</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-paper/65">أنشئ حسابًا مستقلًا لكل موظف وحدد بالضبط ما يستطيع فعله داخل النظام.</p>
        </section>

        {success ? <div className="mt-5 flex items-start gap-3 rounded-xl border border-ok/20 bg-ok/5 p-4 text-sm"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" /><p>{success} ✅</p></div> : null}
        {error ? <div className="mt-5 rounded-xl border border-high/20 bg-high/5 p-4 text-sm text-high">{error}</div> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-xl border border-line bg-elevated p-5 sm:p-6">
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><Users className="size-5" /></div><div><h3 className="font-display text-xl font-semibold">الفريق الحالي</h3><p className="text-sm text-muted">{staff.length} حساب داخل المعمل</p></div></div>
            <div className="mt-5 space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{member.name || member.username}</p><span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] text-teal">{member.role === "owner" ? "مالك المعمل" : roleLabels[member.role]}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${member.isActive ? "bg-ok/10 text-ok" : "bg-high/10 text-high"}`}>{member.isActive ? "نشط" : "موقوف"}</span></div><p className="mt-1 text-xs text-muted" dir="ltr">{member.username}</p></div>
                    {member.role !== "owner" ? <div className="flex flex-wrap items-center gap-2">
                      <select className="h-9 rounded-sm border border-line bg-elevated px-2 text-xs" value={member.role} onChange={(e) => changeStaff(member.id, { role: e.target.value as Exclude<LabRole, "owner"> })}>
                        <option value="technician">فني معمل</option><option value="reviewer">مراجع</option><option value="viewer">مشاهد</option>
                      </select>
                      <Button size="sm" variant={member.isActive ? "danger" : "secondary"} onClick={() => changeStaff(member.id, { isActive: !member.isActive })}><UserX />{member.isActive ? "إيقاف" : "تفعيل"}</Button>
                    </div> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-elevated p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><UserPlus className="size-5" /></div><div><h3 className="font-display text-xl font-semibold">إضافة موظف</h3><p className="text-sm text-muted">كل موظف له تسجيل دخول مستقل.</p></div></div>
            <form onSubmit={submit} className="space-y-4">
              <Field label="اسم الموظف" value={name} onChange={setName} placeholder="أحمد محمد" />
              <Field label="اسم المستخدم" value={username} onChange={setUsername} required placeholder="ahmed_lab" dir="ltr" />
              <Field label="كلمة المرور" value={password} onChange={setPassword} required type="password" minLength={8} placeholder="8 أحرف على الأقل" dir="ltr" />
              <div className="space-y-1.5"><Label htmlFor="role">الصلاحية</Label><select id="role" className="flex h-11 w-full rounded-sm border border-line bg-elevated px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value as Exclude<LabRole, "owner">)}><option value="technician">فني معمل — إنشاء ومشاهدة التقارير</option><option value="reviewer">مراجع — إنشاء ومشاهدة التقارير</option><option value="viewer">مشاهد — مشاهدة التقارير فقط</option></select></div>
              <Button type="submit" size="lg" disabled={loading}>{loading ? "جارٍ إنشاء الحساب…" : "إنشاء حساب الموظف"}</Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, required, placeholder, dir, type = "text", minLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; dir?: "ltr" | "rtl"; type?: string; minLength?: number }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} minLength={minLength} placeholder={placeholder} dir={dir} /></div>;
}
