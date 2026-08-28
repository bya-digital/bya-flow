import { LayoutDashboard } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function DashboardPage() {
  return (
    <ModulePlaceholder
      icon={LayoutDashboard}
      title="Tableau de bord"
      description="Vue d'ensemble de votre activité commerciale."
      phase="Phase 3"
    />
  );
}
