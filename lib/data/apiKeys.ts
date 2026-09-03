import { createClient } from "@/lib/supabase/server";

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export async function getApiKeys(organizationId: string): Promise<ApiKeySummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, created_at, revoked_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes: row.scopes as string[],
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }));
}
