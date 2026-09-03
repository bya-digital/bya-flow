import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const CURRENT_STORE_COOKIE = "bya_current_store";

const CURRENT_STORE_FIELDS =
  "id, organization_id, name, description, logo_url, slug, currency, country, is_active, hero_title, hero_subtitle, hero_image_url, hero_cta_label, accent_color, social_facebook, social_instagram, social_tiktok, social_whatsapp, footer_text, loyalty_enabled, loyalty_earn_rate, loyalty_redeem_value, referral_enabled, referral_bonus_points, referral_welcome_points";

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
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_cta_label: string | null;
  accent_color: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_whatsapp: string | null;
  footer_text: string | null;
  loyalty_enabled: boolean;
  loyalty_earn_rate: number;
  loyalty_redeem_value: number;
  referral_enabled: boolean;
  referral_bonus_points: number;
  referral_welcome_points: number;
}

// Boutique actuellement gérée : celle mémorisée dans le cookie
// bya_current_store si elle appartient bien à l'organisation du membre
// connecté (re-vérifié à chaque appel — un cookie forgé pointant vers la
// boutique d'une autre organisation ne peut donc rien renvoyer d'autre
// que la bascule sur le repli ci-dessous), sinon la première boutique
// créée (comportement historique, inchangé pour toute organisation qui
// n'a encore qu'une seule boutique).
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

  const selectedStoreId = cookies().get(CURRENT_STORE_COOKIE)?.value;

  if (selectedStoreId) {
    const { data: selected } = await supabase
      .from("stores")
      .select(CURRENT_STORE_FIELDS)
      .eq("id", selectedStoreId)
      .eq("organization_id", membership.organization_id)
      .maybeSingle<CurrentStore>();

    if (selected) return selected;
  }

  const { data: store } = await supabase
    .from("stores")
    .select(CURRENT_STORE_FIELDS)
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CurrentStore>();

  return store;
}

export interface OrgStoreSummary {
  id: string;
  name: string;
  slug: string;
}

export async function getOrgStores(organizationId: string): Promise<OrgStoreSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return data ?? [];
}
