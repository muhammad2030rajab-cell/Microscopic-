import { useState, type ReactNode } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileDown, Mail, MessageCircle, Pencil, Printer, Send } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PrintView } from "@/components/report/print-view";
import { Button } from "@/components/ui/button";
import { interpretResult, isCritical } from "@/lib/medical";
import { approveLabReport, getLabReport, submitLabReportForReview } from "@/lib/lab-reports";
import {
  getCurrentLab,
  getCurrentLabPermissions,
  type LabProfileData,
} from "@/lib/lab-access";
import { reportStatusClasses, reportStatusLabels } from "@/lib/report-workflow";

export const Route = createFileRoute("/reports/$id")({
  loader: async ({ params }) => {
    try {
      const [report, lab, access] = await Promise.all([
        getLabReport({ data: { id: params.id } }),
        getCurrentLab(),
        getCurrentLabPermissions(),
      ]);
      return { report, lab, access };
    } catch {
      return {
        report: null,
        lab: null as LabProfileData | null,
        access: null,
      };
    }
  },
  component: ReportDetail,
});

function ReportDetail() {
  const data = Route.useLoaderData();
  const { lab, access } = data;
  const [report, setReport] = useState(data.report);
  const [loading, setLoading] = useState<"submit" | "approve" | null>(null);
  const [error, setError] = useState("");

  if (!lab) return <Navigate to="/login" replace />;
  if (!report) return <AppShell><div className="mx-auto max-w-lg py-16 text-center"><h1 className="font-display text-2xl font-semibold">التقرير غير موجود</h1><Link to="/reports" className="mt-6 inline-flex text-sm text-teal hover:underline">العودة للأرشيف</Link></div></AppShell>;

  const notes = report.tests.map((t) => ({ t, f: interpretResult(t.name, t.value, report.gender, t.customRange) })).filter(({ f }) => f.flag !== "normal" && f.flag !== "unknown");
  const critical = report.tests.filter((t) => isCritical(t.name, t.value));
  const labProfile = {
    name: lab.lab_name,
    nameEn: lab.lab_name_en || lab.lab_name,
    phone: lab.phone || "",
    address: lab.address || "",
    email: lab.email || "",
    website: lab.website || "",
    doctorName: lab.doctor_name || "",
    doctorDegree: lab.doctor_degree || "",
    doctorSpecialty: lab.doctor_specialty || "",
  };

  async function submitForReview() {
    setError(""); setLoading("submit");
    try {
      const result = await submitLabReportForReview({ data: { id: report.id } });
      setReport({ ...report, status: result.status });
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر إرسال التقرير للمراجعة"); }
    finally { setLoading(null); }
  }

  async function approve() {
    setError(""); setLoading("approve");
    try {
      const result = await approveLabReport({ data: { id: report.id } });
      setReport({ ...report, status: result.status, approvedAt: new Date().toISOString() });
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر اعتماد التقرير"); }
    finally { setLoading(null); }
  }

  const isOwner = access?.role === "owner";
  const canEdit = isOwner || access?.permissions["reports.edit"] === true;
  const canSubmit = canEdit && report.status === "draft";
  const canApprove =
    (isOwner || access?.permissions["reports.approve"] === true) &&
    report.status === "pending_review";
  const canPrint = isOwner || access?.permissions["reports.print"] === true;
  const canExport = isOwner || access?.permissions["reports.export"] === true;

  function shareSummaryText() {
    const lines = [
      `تقرير تحليل — ${labProfile.name}`,
      `المريض: ${report.patientName} (${report.age} ${report.gender})`,
      report.doctor ? `الطبيب المحيل: ${report.doctor}` : null,
      "",
      ...report.tests.map((t) => `${t.name}: ${t.value} ${t.unit}`),
      critical.length ? `\n⚠️ قيم حرجة: ${critical.map((t) => `${t.name} (${t.value})`).join("، ")}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  }

  function shareOnWhatsapp() {
    const text = encodeURIComponent(shareSummaryText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function shareByEmail() {
    const subject = encodeURIComponent(`تقرير تحليل — ${report.patientName}`);
    const body = encodeURIComponent(shareSummaryText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return <div className="print-root min-h-dvh bg-paper">
    <div className="no-print">
      <AppShell>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/reports" className="inline-flex h-11 items-center gap-2 text-sm text-ink-soft"><ArrowRight className="size-4" />الأرشيف</Link>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && report.status === "draft" ? <Button variant="secondary" asChild><Link to="/reports/edit/$id" params={{ id: report.id }}><Pencil className="size-4" />تعديل المسودة</Link></Button> : null}
            {canSubmit ? <Button variant="secondary" onClick={submitForReview} disabled={loading !== null}><Send className="size-4" />{loading === "submit" ? "جارٍ الإرسال…" : "إرسال للمراجعة"}</Button> : null}
            {canApprove ? <Button onClick={approve} disabled={loading !== null}><ClipboardCheck className="size-4" />{loading === "approve" ? "جارٍ الاعتماد…" : "اعتماد التقرير"}</Button> : null}
          </div>
        </div>

        <div className="mx-auto mb-5 flex max-w-[820px] flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-elevated p-4">
          <div><p className="text-xs text-muted">حالة التقرير</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs ${reportStatusClasses[report.status]}`}>{reportStatusLabels[report.status]}</span></div>
          {report.status === "pending_review" ? <p className="text-sm text-high">التقرير في انتظار مراجعة واعتماد المسؤول.</p> : null}
          {report.status === "approved" ? <p className="inline-flex items-center gap-1.5 text-sm text-ok"><CheckCircle2 className="size-4" />التقرير معتمد وجاهز كنسخة نهائية.</p> : null}
          {report.status === "draft" ? <p className="text-sm text-muted">يمكن تعديل مسار التقرير ثم إرساله للمراجعة.</p> : null}
        </div>

        <div className="mx-auto mb-5 max-w-[820px] rounded-lg border border-line bg-elevated p-4">
          <p className="mb-3 text-sm font-medium">مشاركة التقرير</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {canExport ? <ShareAction icon={<FileDown className="size-5" />} label="حفظ PDF" color="bg-red-500/10 text-red-600" onClick={() => window.print()} /> : null}
            {canExport ? <ShareAction icon={<MessageCircle className="size-5" />} label="واتساب" color="bg-emerald-500/10 text-emerald-600" onClick={shareOnWhatsapp} /> : null}
            {canExport ? <ShareAction icon={<Mail className="size-5" />} label="بريد إلكتروني" color="bg-teal/10 text-teal" onClick={shareByEmail} /> : null}
            {canPrint ? <ShareAction icon={<Printer className="size-5" />} label="طباعة" color="bg-slate-500/10 text-slate-600" onClick={() => window.print()} /> : null}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">مشاركة واتساب والبريد بترسل ملخص نتائج التقرير كنص. لإرسال التقرير بشكله الكامل (PDF)، استخدم زر "حفظ PDF" ثم أرفق الملف يدويًا.</p>
        </div>
        {error ? <div className="mx-auto mb-5 max-w-[820px] rounded-lg border border-high/20 bg-high/5 p-4 text-sm text-high">{error}</div> : null}

        {(critical.length || notes.length) ? <aside className="mx-auto mb-6 w-full max-w-[820px] rounded-lg border border-line bg-elevated p-4"><h2 className="text-sm font-medium">ملخص طبي</h2>{critical.length > 0 && <p className="mt-2 text-sm text-high">قيم حرجة: {critical.map((t) => `${t.name} (${t.value})`).join("، ")}</p>}<ul className="mt-2 space-y-1.5 text-sm text-ink-soft">{notes.slice(0, 6).map(({ f, t }) => <li key={`${t.categoryId}-${t.name}`}><span className="font-medium text-ink">{t.name}:</span> {f.note}</li>)}</ul></aside> : null}
        <PrintView report={report} lab={labProfile} interactive />
      </AppShell>
    </div>
    <div className="hidden print:block"><PrintView report={report} lab={labProfile} /></div>
  </div>;
}

function ShareAction({
  icon,
  label,
  color,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-lg border border-line bg-elevated p-3 text-center transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <span className={`grid size-10 place-items-center rounded-full ${color}`}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
