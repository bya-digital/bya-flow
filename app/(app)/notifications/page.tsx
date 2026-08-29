import { Bell } from "lucide-react";
import { NotificationList } from "@/components/notifications/NotificationList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const store = await getCurrentStore();

  let notifications: {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read_at: string | null;
  }[] = [];

  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, read_at")
      .eq("organization_id", store.organization_id)
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Historique des notifications générées par vos automatisations."
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Les notifications créées par vos automatisations apparaîtront ici."
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </>
  );
}
