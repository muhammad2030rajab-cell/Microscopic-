import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, Microscope, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { getCurrentAccess } from "@/lib/lab-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const value = login.trim();
    const email = value.includes("@") ? value : `${value.toLowerCase()}@lab.local`;
    // Do not pass callbackURL here: Better Auth may redirect immediately,
    // which bypasses the access check below and sends admins to the home page.
    const result = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "بيانات الدخول غير صحيحة");
      return;
    }
    const access = await getCurrentAccess();
    if (access.type === "admin") {
      await navigate({ to: "/admin" });
      return;
    }
    if (access.type === "lab") {
      await navigate({ to: "/lab" });
      return;
    }
    await authClient.signOut();
    setError("الحساب غير مرتبط بمدير أو بمعمل نشط.");
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-2xl bg-ink p-10 text-paper lg:block">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-teal text-teal-fg">
              <Microscope className="size-5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">Rajab Diagnostics</p>
              <p className="text-sm text-paper/55">Medical Laboratory System</p>
            </div>
          </div>
          <h1 className="mt-16 max-w-lg font-display text-4xl font-semibold leading-tight">
            لوحة تحكم مركزية لإدارة معامل التحاليل الطبية
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-paper/65">
            دخول المدير للوصول إلى المعامل، المستخدمين، التقارير، والصلاحيات من مكان واحد.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-line bg-elevated p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold">دخول المدير</h1>
            <p className="mt-1 text-sm text-muted">المدير يدخل بالبريد الإلكتروني، والمعمل يدخل باسم المستخدم الخاص به.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login">اسم المستخدم أو البريد الإلكتروني</Label>
              <Input id="login" type="text" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required dir="ltr" placeholder="admin@example.com أو lab_username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} dir="ltr" className="ps-9" placeholder="••••••••" />
              </div>
            </div>
            {error ? <p className="rounded-lg border border-high/20 bg-high/5 px-3 py-2 text-sm text-high">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "جارٍ تسجيل الدخول…" : "دخول لوحة التحكم"}
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
            أول مرة تستخدم النظام؟{" "}
            <Link to="/admin/setup" className="font-medium text-teal hover:underline">إنشاء حساب المدير الأول</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
