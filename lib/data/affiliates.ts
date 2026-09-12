import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

// Même dérivation que resolve_affiliate_code() côté SQL — pas de code
// stocké séparément, juste le hash de l'id (identique caractère pour
// caractère à md5() de Postgres pour la même chaîne).
export function affiliateCode(affiliateId: string): string {
  return createHash("md5").update(affiliateId).digest("hex").slice(0, 8).toUpperCase();
}

export interface AffiliateWithStats {
  id: string;
  fullName: string;
  email: string;
  commissionRate: number;
  status: "active" | "suspended";
  code: string;
  orderCount: number;
  totalSales: number;
  totalCommission: number;
}

interface AffiliateRow {
  id: string;
  full_name: string;
  email: string;
  commission_rate: number;
  status: "active" | "suspended";
}

interface OrderStatsRow {
  affiliate_id: string;
  subtotal: number;
  affiliate_commission: number;
}

export async function getAffiliatesWithStats(storeId: string): Promise<AffiliateWithStats[]> {
  const supabase = createClient();

  const [{ data: affiliates }, { data: orders }] = await Promise.all([
    supabase
      .from("affiliates")
      .select("id, full_name, email, commission_rate, status")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .returns<AffiliateRow[]>(),
    supabase
      .from("orders")
      .select("affiliate_id, subtotal, affiliate_commission")
      .eq("store_id", storeId)
      .not("affiliate_id", "is", null)
      .returns<OrderStatsRow[]>(),
  ]);

  const statsByAffiliate = new Map<string, { orderCount: number; totalSales: number; totalCommission: number }>();
  for (const order of orders ?? []) {
    if (!order.affiliate_id) continue;
    const existing = statsByAffiliate.get(order.affiliate_id) ?? {
      orderCount: 0,
      totalSales: 0,
      totalCommission: 0,
    };
    existing.orderCount += 1;
    existing.totalSales += Number(order.subtotal);
    existing.totalCommission += Number(order.affiliate_commission);
    statsByAffiliate.set(order.affiliate_id, existing);
  }

  return (affiliates ?? []).map((affiliate) => {
    const stats = statsByAffiliate.get(affiliate.id) ?? {
      orderCount: 0,
      totalSales: 0,
      totalCommission: 0,
    };
    return {
      id: affiliate.id,
      fullName: affiliate.full_name,
      email: affiliate.email,
      commissionRate: Number(affiliate.commission_rate),
      status: affiliate.status,
      code: affiliateCode(affiliate.id),
      orderCount: stats.orderCount,
      totalSales: stats.totalSales,
      totalCommission: stats.totalCommission,
    };
  });
}
