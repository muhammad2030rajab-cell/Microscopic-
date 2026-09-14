import { createFileRoute, Navigate } from "@tanstack/react-router";
import { getCurrentAccess, type CurrentAccess } from "@/lib/lab-access";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return { access: await getCurrentAccess() };
    } catch {
      return { access: { type: "none" } as CurrentAccess };
    }
  },
  component: Home,
});

function Home() {
  const { access } = Route.useLoaderData();
  if (access.type === "admin") return <Navigate to="/admin" replace />;
  if (access.type === "lab") return <Navigate to="/lab" replace />;
  return <Navigate to="/login" replace />;
}
