import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  FlaskConical,
  Microscope,
  ShieldCheck,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-slate-50"
    >
      {/* الخلفية */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-teal-50" />

      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-teal-200/30 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 size-[28rem] rounded-full bg-sky-200/30 blur-3xl" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-7 sm:px-8 lg:px-12">

        {/* الهيدر */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 sm:text-xs">
              Medical Laboratory
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700">
              Microscopic System
            </p>
          </div>

          <div className="grid size-11 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
            <Microscope
              className="size-6 text-teal-600"
              strokeWidth={1.7}
            />
          </div>
        </header>

        {/* المحتوى الرئيسي */}
        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-10 text-center">

          {/* اللوجو */}
          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-teal-300/20 blur-2xl" />

            <div className="relative grid size-32 place-items-center rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-200 sm:size-40">
              <div className="grid size-24 place-items-center rounded-[1.5rem] bg-gradient-to-br from-teal-50 to-cyan-50 sm:size-30">
                <Microscope
                  className="size-14 text-teal-600 sm:size-20"
                  strokeWidth={1.25}
                />
              </div>
            </div>
          </div>

          {/* اسم البرنامج */}
          <h1 className="mt-7 font-display text-4xl font-bold tracking-tight text-slate-800 sm:text-6xl">
            Microscopic
          </h1>

          <p className="mt-1 font-display text-3xl font-bold text-teal-600 sm:text-5xl">
            System
          </p>

          <p className="mt-3 text-xs font-semibold tracking-[0.35em] text-slate-400 sm:text-sm">
            MEDICAL LABORATORY MANAGEMENT SYSTEM
          </p>

          {/* الترحيب */}
          <div className="mt-9">
            <h2 className="font-display text-3xl font-bold text-slate-800 sm:text-5xl">
              أهلاً وسهلاً بيكم 👋
            </h2>

            <p className="mt-2 text-2xl font-bold text-teal-600 sm:text-4xl">
              نورتوا Microscopic System ✨
            </p>
          </div>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
            نظام متكامل لإدارة معامل التحاليل الطبية
            <br />
            <span className="font-medium text-slate-600">
              بسهولة • دقة • احترافية • أمان
            </span>
          </p>

          {/* المميزات */}
          <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">

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
              label="إدارة التحاليل"
            />

            <Feature
              icon={<ShieldCheck />}
              label="أمان البيانات"
            />

          </div>

          {/* زر البداية */}
          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="group mt-9 flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-teal-600 px-7 py-4 text-lg font-bold text-white shadow-lg shadow-teal-600/20 transition-all duration-200 hover:-translate-y-1 hover:bg-teal-700 hover:shadow-xl active:translate-y-0"
          >
            <span>ابدأ الآن</span>

            <span className="grid size-8 place-items-center rounded-full bg-white/15 transition-transform duration-200 group-hover:-translate-x-1">
              <ArrowLeft className="size-5" />
            </span>
          </button>

        </section>

        {/* الفوتر */}
        <footer className="pb-3 text-center">

          <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-teal-300 to-transparent" />

          <p className="text-xs text-slate-400">
            فكرة وتصميم وتطوير
          </p>

          <p className="mt-1 text-lg font-bold text-slate-800">
            د/ محمد رجب
          </p>

          <p className="mt-1 text-sm font-medium text-teal-600">
            أخصائي التحاليل الطبية
          </p>

          <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.25em] text-slate-300">
            Microscopic System
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
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/75 px-3 py-3 shadow-sm backdrop-blur-sm">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
        {icon}
      </span>

      <span className="text-[11px] font-semibold text-slate-600 sm:text-xs">
        {label}
      </span>
    </div>
  );
}
