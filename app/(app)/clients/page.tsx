import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ClientsPage() {
  return (
    <ModulePlaceholder
      icon={Users}
      title="Clients & CRM"
      description="Fiches clients, prospects, segments et historique."
      phase="Phase 5-6"
    />
  );
}
