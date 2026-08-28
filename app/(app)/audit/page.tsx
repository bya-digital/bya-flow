import { ShieldCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function AuditPage() {
  return (
    <ModulePlaceholder
      icon={ShieldCheck}
      title="Sécurité & audit"
      description="Journal d'activité et contrôle des accès."
      phase="Phase 13"
    />
  );
}
