import { createClient } from "@/lib/supabase/server";

export async function getMyReferralCode(storeId: string, email: string | null): Promise<string | null> {
  if (!email) return null;

  const supabase = createClient();
  const { data } = await supabase.rpc("get_my_referral_code", { p_store_id: storeId });

  return typeof data === "string" ? data : null;
}
