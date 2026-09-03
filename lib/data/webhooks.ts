import { createClient } from "@/lib/supabase/server";

export interface WebhookSummary {
  id: string;
  url: string;
  event: string;
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export async function getWebhooks(organizationId: string): Promise<WebhookSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("webhook_endpoints")
    .select("id, url, event, secret, is_active, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    url: row.url,
    event: row.event,
    secret: row.secret,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}
