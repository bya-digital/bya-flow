import { createClient } from "@/lib/supabase/server";

export interface CurrentStore {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  slug: string;
  currency: string;
  country: string | null;
  is_active: boolean;
}

export async function getCurrentStore(): Promise<CurrentStore | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ organization_id: string }>();

  if (!membership) return null;

  const { data: store } = await supabase
    .from("stores")
    .select("id, organization_id, name, description, logo_url, slug, currency, country, is_active")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CurrentStore>();

  return store;
}
