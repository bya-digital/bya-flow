import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ParametresPage() {
  return (
    <ModulePlaceholder
      icon={Settings}
      title="Paramètres"
      description="Informations générales de votre organisation."
      phase="Phase 2"
    />
  );
}
