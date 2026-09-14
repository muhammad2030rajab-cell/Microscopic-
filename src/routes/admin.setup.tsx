import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { claimFirstPlatformAdmin } from "@/lib/platform-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/setup")({ component: AdminSetup });

function AdminSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const signUp = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
    if (signUp.error) {
      setLoading(false);
      setError(signUp.error.message ?? "تعذر إنشاء الحساب");
      return;
    }
    const claimed = await claimFirstPlatformAdmin();
    setLoading(false);
    if (!claimed) {
      setError("تم إنشاء الحساب، لكن حساب مدير آخر سبقك في تفعيل النظام.");
      return;
    }
    await navigate({ to: "/admin" });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-line bg-elevated p-6 shadow-sm sm:p-8">
        <div className="mb-7">
          <div className="mb-4 grid size-12 place-items-center rounded-xl bg-teal/10 text-teal"><UserPlus className="size-6" /></div>
          <h1 className="font-display text-2xl font-semibold">إنشاء حساب المدير الأول</h1>
          <p className="mt-2 text-sm leading-6 text-muted">استخدم هذه الصفحة أثناء إعداد النظام. أول حساب ناجح يحصل على صلاحية المدير المركزي.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="name">اسم المدير</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label htmlFor="email">البريد الإلكتروني</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" /></div>
          <div className="space-y-1.5"><Label htmlFor="password">كلمة المرور</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} dir="ltr" /></div>
          {error ? <p className="rounded-lg border border-high/20 bg-high/5 px-3 py-2 text-sm text-high">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "جارٍ إنشاء الحساب…" : "إنشاء المدير"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">لديك حساب بالفعل؟ <Link to="/login" className="text-teal hover:underline">تسجيل الدخول</Link></p>
      </section>
    </main>
  );
}
