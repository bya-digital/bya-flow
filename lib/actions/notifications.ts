"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(formData: FormData) {
  const notificationId = formData.get("notificationId") as string;
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const store = await getCurrentStore();
  if (!store) return;

  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", store.organization_id)
    .is("read_at", null);

  revalidatePath("/notifications");
}
