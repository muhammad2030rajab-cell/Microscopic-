import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  FlaskConical,
  Microscope,
  ShieldCheck,
  Users,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!started) return;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = current + 5;

        if (next >= 100) {
          window.clearInterval(timer);

          window.setTimeout(() => {
            navigate({ to: "/login" });
          }, 300);

          return 100;
        }

        return next;
      });
    }, 70);

    return () => {
      window.clearInterval(timer);
    };
  }, [started, navigate]);

  if (started) {
    return (
      <main
        dir="rtl"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/70 via-paper to-teal-50/60" />

        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mx-auto grid size-28 place-items-center rounded-full bg-white shadow-xl ring-1 ring-slate-200">
            <Microscope
              className="size-16 text-teal"
              strokeWidth={1.4}
            />
          </div>

          <h1 className="mt-7 font-display text-4xl font-bold tracking-tight text-ink">
            Microscopic
          </h1>

          <p className="mt-1 text-sm font-medium tracking-[0.28em] text-teal">
            LABORATORY SYSTEM
          </p>

          <h2 className="mt-10 text-xl font-semibold text-ink">
            جاري التحميل...
          </h2>

          <p className="mt-2 text-sm text-muted">
            يتم تجهيز النظام، برجاء الانتظار
          </p>

          <div className="mx-auto mt-8 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 text-sm font-semibold text-teal">
            {progress}%
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <LoadingItem
              icon={<ShieldCheck />}
              label="أمان البيانات"
            />

            <LoadingItem
              icon={<FlaskConical />}
              label="تجهيز النظام"
            />

            <LoadingItem
              icon={<FileText />}
              label="التقارير"
            />
          </div>

          <p className="mt-12 text-xs text-muted">
            فكرة وتصميم
          </p>

          <p className="mt-1 font-semibold text-ink">
            د محمد رجب
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-paper"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/80 via-paper to-teal-50/70" />

      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-teal/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 py-8 sm:px-8 lg:px-12">
        {/* Top */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted">
              Medical Laboratory
            </p>

            <p className="mt-1 text-sm font-semibold text-ink">
              Microscopic System
            </p>
          </div>

          <div className="grid size-11 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <Microscope className="size-6 text-teal" />
          </div>
        </header>

        {/* Main */}
        <section className="mx-auto w-full max-w-4xl py-10 text-center">
          {/* Logo */}
          <div className="mx-auto grid size-32 place-items-center rounded-full bg-white shadow-2xl ring-1 ring-slate-200 sm:size-40">
            <div className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-teal-50 to-sky-50 sm:size-30">
              <Microscope
                className="size-14 text-teal sm:size-20"
                strokeWidth={1.25}
              />
            </div>
          </div>

          <h1 className="mt-7 font-display text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            Microscopic
          </h1>

          <p className="mt-2 text-xs font-semibold tracking-[0.4em] text-teal sm:text-sm">
            LABORATORY SYSTEM
          </p>

          <h2 className="mt-10 font-display text-2xl font-bold text-ink sm:text-4xl">
            مرحباً بكم في
          </h2>

          <p className="mt-2 text-2xl font-semibold text-ink sm:text-4xl">
            Microscopic System
          </p>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base">
            إدارة معملية أكثر سهولة واحترافية
            <br />
            دقة في التحليل .. ثقة في النتيجة
          </p>

          {/* Features */}
          <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-5">
            <Feature
              icon={<FileText />}
              label="تقارير دقيقة"
            />

            <Feature
              icon={<Users />}
              label="إدارة المرضى"
            />

            <Feature
              icon={<FlaskConical />}
              label="قائمة التحاليل"
            />

            <Feature
              icon={<BarChart3 />}
              label="إحصائيات فورية"
            />

            <Feature
              icon={<ShieldCheck />}
              label="أمان وخصوصية"
            />
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={() => {
              setProgress(0);
              setStarted(true);
            }}
            className="mx-auto mt-9 flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-teal px-7 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            <span>ابدأ الآن</span>

            <ArrowLeft className="size-6" />
          </button>
        </section>

        {/* Footer */}
        <footer className="pb-2 text-center">
          <p className="text-xs text-muted">
            فكرة وتصميم
          </p>

          <p className="mt-1 text-base font-bold text-ink">
            د محمد رجب
          </p>

          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted">
            Built for Better Care
          </p>
        </footer>
      </div>
    </main>
  );
}

function Feature({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/75 p-3 shadow-sm backdrop-blur-sm">
      <span className="grid size-10 place-items-center rounded-xl bg-teal/10 text-teal">
        {icon}
      </span>

      <span className="text-[11px] font-medium text-ink sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function LoadingItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
      <span className="mx-auto grid size-9 place-items-center rounded-xl bg-teal/10 text-teal">
        {icon}
      </span>

      <p className="mt-2 text-[10px] text-muted">
        {label}
      </p>
    </div>
  );
}
