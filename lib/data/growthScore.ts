import { calculateGrowthScore, type GrowthScoreResult } from "@/lib/score/calculateScore";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function getGrowthScore(): Promise<GrowthScoreResult | null> {
  const store = await getCurrentStore();
  if (!store) return null;

  const supabase = createClient();

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);
  const previousStart = new Date(periodStart);
  previousStart.setDate(previousStart.getDate() - 30);

  const [
    currentOrdersRes,
    previousOrdersRes,
    totalCustomersRes,
    orderingCustomersRes,
    cartsRes,
    activeProductsRes,
    soldItemsRes,
    campaignsRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total")
      .eq("store_id", store.id)
      .gte("created_at", periodStart.toISOString()),
    supabase
      .from("orders")
      .select("id, total")
      .eq("store_id", store.id)
      .gte("created_at", previousStart.toISOString())
      .lt("created_at", periodStart.toISOString()),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", store.organization_id),
    supabase
      .from("orders")
      .select("customer_id")
      .eq("store_id", store.id)
      .gte("created_at", periodStart.toISOString())
      .not("customer_id", "is", null),
    supabase.from("carts").select("status").eq("store_id", store.id).gte("created_at", periodStart.toISOString()),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("status", "active"),
    supabase
      .from("order_items")
      .select("product_id, order:orders!inner(store_id, created_at)")
      .eq("order.store_id", store.id)
      .gte("order.created_at", periodStart.toISOString()),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", store.organization_id)
      .eq("status", "sent")
      .gte("sent_at", periodStart.toISOString()),
  ]);

  const currentOrders = currentOrdersRes.data ?? [];
  const previousOrders = previousOrdersRes.data ?? [];

  const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const currentAverageBasket = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
  const previousAverageBasket =
    previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;

  const distinctOrderingCustomers = new Set(
    (orderingCustomersRes.data ?? []).map((row) => row.customer_id).filter(Boolean)
  ).size;

  const carts = cartsRes.data ?? [];
  const cartsAbandoned = carts.filter((cart) => cart.status === "abandoned").length;
  const cartsConverted = carts.filter((cart) => cart.status === "converted").length;
  const conversionRate = carts.length > 0 ? (cartsConverted / carts.length) * 100 : null;

  const soldProductIds = new Set(
    ((soldItemsRes.data ?? []) as unknown as { product_id: string | null }[])
      .map((row) => row.product_id)
      .filter((id): id is string => Boolean(id))
  );

  return calculateGrowthScore({
    currentRevenue,
    previousRevenue,
    currentAverageBasket,
    previousAverageBasket,
    conversionRate,
    totalCustomers: totalCustomersRes.count ?? 0,
    activeCustomers: distinctOrderingCustomers,
    ordersCount: currentOrders.length,
    distinctOrderingCustomers,
    cartsAbandoned,
    cartsTotal: carts.length,
    activeProductsCount: activeProductsRes.count ?? 0,
    productsWithSalesCount: soldProductIds.size,
    campaignsSentRecently: campaignsRes.count ?? 0,
  });
}
