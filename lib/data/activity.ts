import { createClient } from "@/lib/supabase/server";

export interface ActivityLogEntry {
  id: string;
  actorName: string | null;
  action: string;
  targetLabel: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const RECENT_LIMIT = 50;

export async function getRecentActivity(organizationId: string): Promise<ActivityLogEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("activity_logs")
    .select("id, actor_name, action, target_label, metadata, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  return (data ?? []).map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    action: row.action,
    targetLabel: row.target_label,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  }));
}
