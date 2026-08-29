import { BarChart3, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { GrowthScoreGauge } from "@/components/score/GrowthScoreGauge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getGrowthScore } from "@/lib/data/growthScore";
import { createClient } from "@/lib/supabase/server";

const dayLabelFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

interface OrderRow {
  id: string;
  total: number;
  created_at: string;
}

interface OrderItemRow {
  quantity: number;
  product: { id: string; name: string } | null;
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ organization_id: string }>();

  const { data: store } = membership
    ? await supabase
        .from("stores")
        .select("id, currency")
        .eq("organization_id", membership.organization_id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle<{ id: string; currency: string }>()
    : { data: null };

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store?.currency ?? "EUR",
    maximumFractionDigits: 0,
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  let ordersList: OrderRow[] = [];
  let newCustomersCount = 0;
  let orderItemRows: OrderItemRow[] = [];

  if (store && membership) {
    const [ordersRes, customersRes, itemsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total, created_at")
        .eq("store_id", store.id)
        .gte("created_at", sinceIso),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id)
        .gte("created_at", sinceIso),
      supabase
        .from("order_items")
        .select("quantity, product:products(id, name), order:orders!inner(store_id)")
        .eq("order.store_id", store.id),
    ]);

    ordersList = (ordersRes.data ?? []) as OrderRow[];
    newCustomersCount = customersRes.count ?? 0;
    orderItemRows = (itemsRes.data ?? []) as unknown as OrderItemRow[];
  }

  const revenue = ordersList.reduce((sum, order) => sum + Number(order.total), 0);
  const orderCount = ordersList.length;
  const averageBasket = orderCount > 0 ? revenue / orderCount : 0;

  const revenueByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    revenueByDay.set(toDateKey(day), 0);
  }
  for (const order of ordersList) {
    const key = order.created_at.slice(0, 10);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(order.total));
    }
  }
  const chartData = Array.from(revenueByDay.entries()).map(([key, value]) => ({
    date: dayLabelFormatter.format(new Date(key)),
    revenue: value,
  }));

  const productTotals = new Map<string, { name: string; quantity: number }>();
  for (const row of orderItemRows) {
    if (!row.product) continue;
    const existing = productTotals.get(row.product.id);
    productTotals.set(row.product.id, {
      name: row.product.name,
      quantity: (existing?.quantity ?? 0) + row.quantity,
    });
  }
  const topProducts = Array.from(productTotals.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const growthScore = await getGrowthScore();

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité commerciale (30 derniers jours)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Chiffre d'affaires"
          value={currencyFormatter.format(revenue)}
          hint="30 derniers jours"
          icon={TrendingUp}
        />
        <KpiCard
          label="Commandes"
          value={orderCount.toString()}
          hint="30 derniers jours"
          icon={ShoppingCart}
        />
        <KpiCard
          label="Panier moyen"
          value={orderCount > 0 ? currencyFormatter.format(averageBasket) : "—"}
          hint="30 derniers jours"
          icon={BarChart3}
        />
        <KpiCard
          label="Nouveaux clients"
          value={newCustomersCount.toString()}
          hint="30 derniers jours"
          icon={Users}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Évolution des ventes</h2>
          </CardHeader>
          <CardContent>
            <SalesChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Produits les plus vendus</h2>
          </CardHeader>
          <CardContent>
            <TopProducts products={topProducts} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {growthScore && (
          <Card className="flex flex-col items-center justify-center p-6">
            <div className="mb-3 flex w-full items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">BYA Flow Score</h2>
              <Link href="/ia" className="text-xs font-medium text-brand-600 hover:underline">
                Détail
              </Link>
            </div>
            <GrowthScoreGauge
              score={growthScore.score}
              band={growthScore.band}
              bandLabel={growthScore.bandLabel}
              size={140}
            />
          </Card>
        )}
        <div className="lg:col-span-2">
          <RecommendationsPanel recommendations={[]} />
        </div>
      </div>
    </>
  );
}
