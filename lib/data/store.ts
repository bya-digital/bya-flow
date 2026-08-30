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
    .select(
      "id, organization_id, name, description, logo_url, slug, currency, country, is_active, hero_title, hero_subtitle, hero_image_url, hero_cta_label, accent_color, social_facebook, social_instagram, social_tiktok, social_whatsapp, footer_text, loyalty_enabled, loyalty_earn_rate, loyalty_redeem_value, referral_enabled, referral_bonus_points, referral_welcome_points"
    )
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<CurrentStore>();

  return store;
}
