import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, CheckCircle2, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPlatformAdmin, createLab, listAdminLabs, type AdminLab } from "@/lib/platform-admin";

export const Route = createFileRoute("/admin/labs")({
  loader: async () => ({ isAdmin: await isPlatformAdmin(), labs: await listAdminLabs() }),
  component: AdminLabs,
});

function AdminLabs() {
  const { isAdmin, labs: initialLabs } = Route.useLoaderData();
  const navigate = useNavigate();
  const [labs, setLabs] = useState<AdminLab[]>(initialLabs);
  const [showForm, setShowForm] = useState(initialLabs.length === 0);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setLabs(initialLabs), [initialLabs]);

  if (!isAdmin) return <Navigate to="/login" />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await createLab({ data: { name, nameEn, username, password, phone, address, doctorName } });
      setLabs((current) => [{
        id: result.id,
        name: result.name,
        nameEn: nameEn || null,
        username: result.username,
        phone: phone || null,
        address: address || null,
        doctorName: doctorName || null,
        isActive: true,
        createdAt: new Date().toISOString(),
      }, ...current]);
      setSuccess(`تم إنشاء ${result.name} بنجاح — اسم المستخدم: ${result.username}`);
      setName(""); setNameEn(""); setUsername(""); setPassword(""); setPhone(""); setAddress(""); setDoctorName("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إنشاء المعمل");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Central administration</p>
            <h1 className="mt-1 font-display text-xl font-semibold">إدارة المعامل 🏥</h1>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-teal hover:underline"><ArrowRight className="size-4" /> لوحة التحكم</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl bg-ink p-6 text-paper sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-paper/60">Laboratory network</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">أضف أول معمل للنظام</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-paper/65">كل معمل سيحصل على حساب مستقل، وبياناته وتقاريره ستظل معزولة عن باقي المعامل.</p>
            </div>
            <div className="hidden size-12 place-items-center rounded-xl bg-teal/15 text-teal sm:grid"><Building2 className="size-6" /></div>
          </div>
        </section>

        {success ? <div className="mt-5 flex items-start gap-3 rounded-xl border border-ok/20 bg-ok/5 p-4 text-sm"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" /><div><p className="font-medium">تم إنشاء المعمل بنجاح ✅</p><p className="mt-1 text-muted">{success}</p></div></div> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-xl border border-line bg-elevated p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="font-display text-xl font-semibold">المعامل الحالية</h3><p className="mt-1 text-sm text-muted">{labs.length} معمل مسجل</p></div>
              <Button type="button" variant="outline" onClick={() => setShowForm(true)}><Plus className="size-4" /> إضافة</Button>
            </div>
            <div className="mt-5 space-y-3">
              {labs.length === 0 ? <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">لسه مفيش معامل. أضف أول معمل من النموذج.</p> : labs.map((lab) => (
                <div key={lab.id} className="rounded-lg border border-line p-4">
                  <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal"><Building2 className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{lab.name}</p><span className="rounded-full bg-ok/10 px-2 py-0.5 text-[11px] text-ok">نشط</span></div><p className="mt-1 text-xs text-muted">Username: <span dir="ltr">{lab.username}</span></p>{lab.doctorName ? <p className="mt-1 text-xs text-muted">مدير المعمل: {lab.doctorName}</p> : null}</div></div>
                </div>
              ))}
            </div>
          </section>

          {showForm ? <section className="rounded-xl border border-line bg-elevated p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-lg bg-teal/10 text-teal"><ShieldCheck className="size-5" /></div><div><h3 className="font-display text-xl font-semibold">بيانات المعمل</h3><p className="text-sm text-muted">البيانات دي هتظهر في تقارير المعمل لاحقًا.</p></div></div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="lab-name" label="اسم المعمل" value={name} onChange={setName} required placeholder="معمل النور" />
                <Field id="lab-name-en" label="اسم المعمل بالإنجليزية" value={nameEn} onChange={setNameEn} placeholder="Al Noor Lab" dir="ltr" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="username" label="اسم المستخدم" value={username} onChange={setUsername} required placeholder="noor_lab" dir="ltr" />
                <Field id="password" label="كلمة المرور" value={password} onChange={setPassword} required type="password" minLength={8} placeholder="8 أحرف على الأقل" dir="ltr" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="phone" label="رقم الهاتف" value={phone} onChange={setPhone} placeholder="01xxxxxxxxx" dir="ltr" />
                <Field id="doctor" label="اسم مدير المعمل" value={doctorName} onChange={setDoctorName} placeholder="د. أحمد محمد" />
              </div>
              <Field id="address" label="العنوان" value={address} onChange={setAddress} placeholder="العنوان بالتفصيل" />
              {error ? <p className="rounded-lg border border-high/20 bg-high/5 px-3 py-2 text-sm text-high">{error}</p> : null}
              <div className="flex flex-wrap gap-3 pt-2"><Button type="submit" size="lg" disabled={loading}>{loading ? "جارٍ إنشاء المعمل…" : "إنشاء المعمل"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button></div>
            </form>
          </section> : <section className="grid min-h-[320px] place-items-center rounded-xl border border-dashed border-line bg-elevated p-8 text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-xl bg-teal/10 text-teal"><Plus className="size-6" /></div><h3 className="mt-4 font-display text-xl font-semibold">جاهز لإضافة معمل جديد</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">اضغط «إضافة» لإنشاء حساب المعمل وتحديد اسم المستخدم وكلمة المرور.</p><Button className="mt-5" onClick={() => setShowForm(true)}>إضافة معمل</Button></div></section>}
        </div>
      </div>
    </main>
  );
}

function Field({ id, label, value, onChange, required, placeholder, dir, type = "text", minLength }: { id: string; label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; dir?: "ltr" | "rtl"; type?: string; minLength?: number }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} minLength={minLength} placeholder={placeholder} dir={dir} /></div>;
}
