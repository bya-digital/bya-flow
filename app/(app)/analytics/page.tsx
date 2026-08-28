import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function AnalyticsPage() {
  return (
    <ModulePlaceholder
      icon={BarChart3}
      title="Analytics"
      description="Chiffre d'affaires, conversion et performance des ventes."
      phase="Phase 9"
    />
  );
}
