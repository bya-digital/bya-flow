import { createClient } from "@/lib/supabase/server";

export async function getCustomerLoyaltyBalance(
  storeId: string,
  email: string | null
): Promise<number> {
  if (!email) return 0;

  const supabase = createClient();
  const { data } = await supabase.rpc("get_customer_loyalty_balance", {
    p_store_id: storeId,
    p_email: email,
  });

  return typeof data === "number" ? data : 0;
}
