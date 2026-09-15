import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  FlaskConical,
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
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-50 px-4 py-3"
    >
      {/* خلفية طبية ناعمة */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_90%_85%,rgba(56,189,248,0.10),transparent_32%),linear-gradient(145deg,#ecfeff_0%,#ffffff_52%,#f0fdfa_100%)]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">

        {/* اسم النظام */}
        <div className="mt-1">
          <h1 className="font-display text-[42px] font-bold leading-none tracking-tight text-slate-800 sm:text-5xl">
            Microscopic
          </h1>

          <div className="mt-1 flex items-center justify-center gap-3">
            <span className="h-px w-9 bg-teal-400" />

            <span className="font-display text-[27px] font-bold leading-none tracking-[0.12em] text-teal-600">
              System
            </span>

            <span className="h-px w-9 bg-teal-400" />
          </div>
        </div>

        {/* الترحيب */}
        <div className="mt-5">
          <p className="font-display text-[30px] font-semibold leading-tight text-slate-800">
            مرحباً بكم في
          </p>

          <p className="mt-1 text-[24px] font-bold leading-tight text-teal-600">
            ✨ Microscopic System
          </p>

          <p className="mt-3 text-[14px] font-medium text-slate-500">
            إدارة معملية أكثر سهولة واحترافية
          </p>
        </div>

        {/* الخدمات */}
        <div className="mt-5 grid w-full grid-cols-2 gap-2.5">

          <Feature
            icon={<FileText />}
            label="تقارير دقيقة"
          />

          <Feature
            icon={<FlaskConical />}
            label="التحاليل"
          />

          <Feature
            icon={<Users />}
            label="المرضى"
          />

          <Feature
            icon={<BarChart3 />}
            label="الإحصائيات"
          />

          <div className="col-span-2 flex justify-center">
            <Feature
              icon={<ShieldCheck />}
              label="الأمان"
              wide
            />
          </div>

        </div>

        {/* زر البداية */}
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="mt-4 flex w-full items-center justify-center gap-4 rounded-[22px] bg-teal-600 px-5 py-3.5 text-[22px] font-bold text-white shadow-[0_12px_28px_rgba(13,148,136,0.24)] transition active:scale-[0.985] hover:bg-teal-700"
        >
          <span className="grid size-10 place-items-center rounded-full bg-white/15 text-2xl">
            ←
          </span>

          <span>ابدأ الآن</span>
        </button>

        {/* المطور */}
        <div className="mt-4 w-full border-t border-teal-100/80 pt-3">

          <p className="text-[11px] font-medium text-slate-400">
            فكرة وتصميم وتطوير
          </p>

          <p className="mt-0.5 text-[18px] font-bold text-slate-800">
            د/ محمد رجب
          </p>

          <p className="mt-0.5 text-[13px] font-bold text-teal-600">
            أخصائي التحاليل الطبية
          </p>

          <p className="mt-2 text-[14px] font-semibold text-slate-500">
            🔬 لولا المختبر، ما اكتمل التشخيص.
          </p>

          <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.24em] text-slate-300">
            MICROSCOPIC SYSTEM
          </p>

        </div>

      </div>
    </main>
  );
}

function Feature({
  icon,
  label,
  wide = false,
}: {
  icon: React.ReactNode;
  label: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex h-[58px] items-center justify-center gap-3 rounded-[20px] border border-white bg-white/85 px-4 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 backdrop-blur-sm ${
        wide ? "w-[calc(50%-5px)]" : "w-full"
      }`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
        {icon}
      </span>

      <span className="text-[13px] font-bold text-slate-600">
        {label}
      </span>
    </div>
  );
}
