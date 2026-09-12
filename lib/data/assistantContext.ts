import { getCustomerRfmMap } from "@/lib/data/crm";
import { getGrowthScore } from "@/lib/data/growthScore";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";
import type { ChatContext } from "@/lib/ai/types";

// Rassemble les VRAIES données de la boutique (aucune supposition,
// aucun chiffre inventé) pour que l'assistant IA puisse répondre à
// des questions concrètes — même discipline que le reste du projet :
// jamais une réponse qui prétend savoir quelque chose que les
// données ne confirment pas.
export async function getAssistantContext(): Promise<ChatContext | null> {
  const store = await getCurrentStore();
  if (!store) return null;

  const supabase = createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [ordersRes, newCustomersRes, totalCustomersRes, itemsRes, growthScore, rfmMap] =
    await Promise.all([
      supabase.from("orders").select("total").eq("store_id", store.id).gte("created_at", sinceIso),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", store.organization_id)
        .gte("created_at", sinceIso),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", store.organization_id),
      supabase
        .from("order_items")
        .select("quantity, product:products(id, name), order:orders!inner(store_id, created_at)")
        .eq("order.store_id", store.id)
        .gte("order.created_at", sinceIso),
      getGrowthScore(),
      getCustomerRfmMap(store.id),
    ]);

  const orders = ordersRes.data ?? [];
  const revenue30d = orders.reduce((sum, o) => sum + Number(o.total), 0);

  const productTotals = new Map<string, { name: string; quantity: number }>();
  for (const row of (itemsRes.data ?? []) as unknown as {
    quantity: number;
    product: { id: string; name: string } | null;
  }[]) {
    if (!row.product) continue;
    const existing = productTotals.get(row.product.id);
    productTotals.set(row.product.id, {
      name: row.product.name,
      quantity: (existing?.quantity ?? 0) + row.quantity,
    });
  }
  const topProduct = Array.from(productTotals.values()).sort((a, b) => b.quantity - a.quantity)[0];

  let vipCount = 0;
  let atRiskCount = 0;
  for (const rfm of rfmMap.values()) {
    if (rfm.segment === "vip") vipCount += 1;
    if (rfm.segment === "at_risk") atRiskCount += 1;
  }

  return {
    storeName: store.name,
    currency: store.currency,
    revenue30d,
    ordersCount30d: orders.length,
    averageBasket30d: orders.length > 0 ? revenue30d / orders.length : 0,
    newCustomers30d: newCustomersRes.count ?? 0,
    totalCustomers: totalCustomersRes.count ?? 0,
    topProduct: topProduct ? { name: topProduct.name, unitsSold: topProduct.quantity } : null,
    growthScore: growthScore?.score ?? null,
    vipCount,
    atRiskCount,
  };
}
