import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { ReportWizard } from "@/components/report/wizard";
import { getCurrentLab } from "@/lib/lab-access";
import { getLabReport } from "@/lib/lab-reports";
import { listLabCatalog } from "@/lib/lab-catalog";
import type { Draft } from "@/lib/store";

export const Route = createFileRoute("/reports/edit/$id")({
  loader: async ({ params }) => {
    const [lab, report, catalog] = await Promise.all([getCurrentLab(), getLabReport({ data: { id: params.id } }), listLabCatalog()]);
    return { lab, report, catalog };
  },
  component: EditReportPage,
});

function EditReportPage() {
  const { lab, report, catalog } = Route.useLoaderData();
  if (lab.role === "viewer" || !report || report.status !== "draft") return <Navigate to={report ? "/reports/$id" : "/reports"} params={report ? { id: report.id } : undefined} />;
  const draft: Draft = {
    patientName: report.patientName, patientCode: report.patientCode, age: String(report.age), gender: report.gender,
    phone: report.phone || "", nationalId: report.nationalId || "", doctor: report.doctor, selectedCategoryIds: Array.from(new Set(report.tests.map((t) => t.categoryId))),
    tests: report.tests, notes: report.notes || "", step: 0,
  };
  return <AppShell><ReportWizard catalog={catalog} editReport={{ id: report.id, draft }} /></AppShell>;
}
