import { getPlan, type Plan } from "@/lib/billing/plans";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export interface SubscriptionSummary {
  plan: Plan;
  status: string;
  since: string;
  productsUsed: number;
  ordersUsedThisMonth: number;
  teamMembersUsed: number;
}

export async function getSubscriptionSummary(): Promise<SubscriptionSummary | null> {
  const store = await getCurrentStore();
  if (!store) return null;

  const supabase = createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [subscriptionRes, productsRes, ordersRes, membersRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, created_at")
      .eq("organization_id", store.organization_id)
      .maybeSingle(),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", store.organization_id),
  ]);

  const subscription = subscriptionRes.data;

  return {
    plan: getPlan(subscription?.plan),
    status: subscription?.status ?? "active",
    since: subscription?.created_at ?? new Date().toISOString(),
    productsUsed: productsRes.count ?? 0,
    ordersUsedThisMonth: ordersRes.count ?? 0,
    teamMembersUsed: membersRes.count ?? 0,
  };
}
