import { Workflow } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function AutomatisationsPage() {
  return (
    <ModulePlaceholder
      icon={Workflow}
      title="Automatisations"
      description="Déclencheurs, conditions et actions automatiques."
      phase="Phase 8"
    />
  );
}
