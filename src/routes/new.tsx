import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { ReportWizard } from "@/components/report/wizard";
import { getCurrentLab } from "@/lib/lab-access";
import { listLabCatalog } from "@/lib/lab-catalog";

export const Route = createFileRoute("/new")({
  loader: async () => {
    const [lab, catalog] = await Promise.all([getCurrentLab(), listLabCatalog()]);
    return { lab, catalog };
  },
  component: NewReportPage,
});

function NewReportPage() {
  const { lab, catalog } = Route.useLoaderData();
  if (lab.role === "viewer") return <Navigate to="/reports" />;
  return (
    <AppShell>
      <ReportWizard catalog={catalog} />
    </AppShell>
  );
}
