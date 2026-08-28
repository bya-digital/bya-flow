import { Bell } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function NotificationsPage() {
  return (
    <ModulePlaceholder
      icon={Bell}
      title="Notifications"
      description="Préférences et historique de notifications."
      phase="Phase 13"
    />
  );
}
