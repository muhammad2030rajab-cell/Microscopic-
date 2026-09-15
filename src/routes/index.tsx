import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  FileText,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    "تهيئة النظام...",
    "تجهيز التحاليل الطبية...",
    "تجهيز التقارير...",
    "تأمين بيانات المرضى...",
    "مراجعة إعدادات المعمل...",
    "كل شيء جاهز ✨",
  ];

  useEffect(() => {
    if (!loading) return;

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 4, 100);

        if (next >= 100) {
          window.clearInterval(progressTimer);

          window.setTimeout(() => {
            setLeaving(true);

            window.setTimeout(() => {
              navigate({ to: "/login" });
            }, 650);
          }, 500);
        }

        return next;
      });
    }, 70);

    return () => {
      window.clearInterval(progressTimer);
    };
  }, [loading, navigate]);

  useEffect(() => {
    if (!loading) return;

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) =>
        Math.min(current + 1, loadingMessages.length - 1),
      );
    }, 420);

    return () => {
      window.clearInterval(messageTimer);
    };
  }, [loading]);

  function startSystem() {
    if (loading) return;

    setProgress(0);
    setMessageIndex(0);
    setLoading(true);
  }

  return (
    <main
      dir="rtl"
      className={`relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-50 px-3 py-2 transition-all duration-700 sm:px-4 sm:py-3 ${
        leaving
          ? "scale-[1.03] opacity-0"
          : "scale-100 opacity-100"
      }`}
    >
      {/* الخلفية */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_90%_85%,rgba(56,189,248,0.10),transparent_32%),linear-gradient(145deg,#ecfeff_0%,#ffffff_52%,#f0fdfa_100%)]" />

      {/* دوائر متحركة في الخلفية */}
      <div className="pointer-events-none absolute -right-20 top-10 size-48 rounded-full bg-teal-300/10 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -left-20 bottom-10 size-56 rounded-full bg-cyan-300/10 blur-3xl animate-pulse" />

      <div className="relative z-10 flex max-h-full w-full max-w-md flex-col items-center justify-center text-center">

        {/* LOGO */}
        <div
          className={`shrink-0 transition-all duration-500 ${
            loading ? "scale-95" : "scale-100"
          }`}
        >
          <div className="relative mx-auto mb-2 grid size-16 place-items-center rounded-[22px] bg-white shadow-[0_10px_30px_rgba(13,148,136,0.15)] ring-1 ring-teal-100">
            <FlaskConical className="size-8 text-teal-600" />

            <div className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-teal-500 text-white shadow-md">
              <Sparkles className="size-3.5" />
            </div>
          </div>

          <h1 className="font-display text-[clamp(30px,8vw,42px)] font-bold leading-none tracking-tight text-slate-800">
            Microscopic
          </h1>

          <div className="mt-1 flex items-center justify-center gap-2.5">
            <span className="h-px w-7 bg-teal-400 sm:w-9" />

            <span className="font-display text-[clamp(20px,5vw,27px)] font-bold leading-none tracking-[0.12em] text-teal-600">
              System
            </span>

            <span className="h-px w-7 bg-teal-400 sm:w-9" />
          </div>
        </div>

        {/* WELCOME */}
        <div className="mt-[clamp(10px,2.5vh,20px)] shrink-0">
          <p className="font-display text-[clamp(22px,6vw,30px)] font-semibold leading-tight text-slate-800">
            مرحباً بكم في
          </p>

          <p className="mt-1 text-[clamp(18px,5vw,24px)] font-bold leading-tight text-teal-600">
            ✨ Microscopic System
          </p>

          <p className="mt-2 text-[clamp(11px,3vw,14px)] font-medium text-slate-500">
            إدارة معملية أكثر سهولة واحترافية
          </p>
        </div>

        {/* FEATURES */}
        <div className="mt-[clamp(10px,2.5vh,20px)] grid w-full shrink-0 grid-cols-2 gap-2 sm:gap-2.5">
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

        {/* LOADING AREA */}
        <div
          className={`mt-[clamp(9px,2vh,15px)] w-full shrink-0 transition-all duration-500 ${
            loading
              ? "rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-teal-100"
              : ""
          }`}
        >
          {loading && (
            <>
              {/* رسالة التحميل */}
              <div className="mb-2 flex items-center justify-center gap-2">
                <div className="grid size-7 place-items-center rounded-full bg-teal-50">
                  <FlaskConical className="size-4 animate-pulse text-teal-600" />
                </div>

                <span className="text-xs font-bold text-slate-600">
                  {loadingMessages[messageIndex]}
                </span>
              </div>

              {/* النسبة */}
              <div className="mb-1.5 flex items-center justify-between px-1 text-[10px] font-semibold sm:text-xs">
                <span className="text-slate-400">
                  جاري تجهيز النظام
                </span>

                <span className="font-bold text-teal-600">
                  {progress}%
                </span>
              </div>

              {/* Progress */}
              <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner ring-1 ring-slate-200/70">
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-teal-600 transition-[width] duration-100 ease-out"
                  style={{
                    width: `${progress}%`,
                  }}
                >
                  {/* لمعان متحرك */}
                  <div className="absolute inset-y-0 right-0 w-16 bg-white/30 blur-sm animate-pulse" />
                </div>
              </div>

              {/* حالة النظام */}
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-medium text-slate-400">
                <CheckCircle2
                  className={`size-3.5 ${
                    progress >= 100
                      ? "text-teal-500"
                      : "animate-pulse text-teal-400"
                  }`}
                />

                <span>
                  {progress >= 100
                    ? "تم تجهيز النظام — جاري الدخول..."
                    : "يتم تجهيز التقارير والتحاليل بأمان"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* START BUTTON */}
        <button
          type="button"
          onClick={startSystem}
          disabled={loading}
          className={`mt-[clamp(9px,1.8vh,14px)] flex w-full shrink-0 items-center justify-center gap-3 rounded-[20px] px-4 py-[clamp(10px,2.2vh,14px)] text-[clamp(18px,5vw,22px)] font-bold text-white shadow-[0_10px_24px_rgba(13,148,136,0.22)] transition-all duration-300 ${
            loading
              ? "cursor-wait bg-teal-500"
              : "bg-teal-600 hover:bg-teal-700 active:scale-[0.985]"
          }`}
        >
          <span
            className={`grid size-9 place-items-center rounded-full bg-white/15 text-xl ${
              loading ? "animate-spin" : ""
            }`}
          >
            {loading ? "⟳" : "←"}
          </span>

          <span>
            {loading ? "جاري الدخول..." : "ابدأ الآن"}
          </span>
        </button>

        {/* DEVELOPER */}
        <div className="mt-[clamp(8px,1.6vh,13px)] w-full shrink-0 border-t border-teal-100/80 pt-[clamp(7px,1.4vh,11px)]">
          <p className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
            فكرة وتصميم وتطوير
          </p>

          <p className="mt-0.5 text-[16px] font-bold text-slate-800 sm:text-[18px]">
            د/ محمد رجب
          </p>

          <p className="mt-0.5 text-[12px] font-bold text-teal-600 sm:text-[13px]">
            أخصائي التحاليل الطبية
          </p>

          <p className="mt-1 text-[12px] font-semibold text-slate-500 sm:text-[14px]">
            🔬 لولا المختبر، ما اكتمل التشخيص.
          </p>

          <p className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.24em] text-slate-300 sm:text-[8px]">
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
      className={`flex h-[clamp(48px,7.5vh,58px)] items-center justify-center gap-2 rounded-[18px] border border-white bg-white/85 px-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/60 backdrop-blur-sm sm:gap-3 sm:px-4 ${
        wide ? "w-[calc(50%-4px)]" : "w-full"
      }`}
    >
      <span className="grid size-[clamp(30px,5vw,36px)] shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
        {icon}
      </span>

      <span className="text-[clamp(11px,3vw,13px)] font-bold text-slate-600">
        {label}
      </span>
    </div>
  );
}
