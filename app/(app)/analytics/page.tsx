import { BarChart3, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { OrderStatusBreakdown } from "@/components/analytics/OrderStatusBreakdown";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const dayLabelFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });
const monthLabelFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

interface OrderRow {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  product: { id: string; name: string } | null;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = [7, 30, 90, 365].includes(Number(searchParams.period))
    ? Number(searchParams.period)
    : 30;

  const store = await getCurrentStore();

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store?.currency ?? "EUR",
    maximumFractionDigits: 0,
  });

  const since = new Date();
  since.setDate(since.getDate() - period);
  const sinceIso = since.toISOString();

  let ordersList: OrderRow[] = [];
  let newCustomersCount = 0;
  let orderItemRows: OrderItemRow[] = [];
  let cartsTotal = 0;
  let cartsConverted = 0;

  if (store) {
    const supabase = createClient();

    const [ordersRes, customersRes, itemsRes, cartsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total, status, created_at")
        .eq("store_id", store.id)
        .gte("created_at", sinceIso),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", store.organization_id)
        .gte("created_at", sinceIso),
      supabase
        .from("order_items")
        .select("quantity, unit_price, product:products(id, name), order:orders!inner(store_id, created_at)")
        .eq("order.store_id", store.id)
        .gte("order.created_at", sinceIso),
      supabase.from("carts").select("status").eq("store_id", store.id).gte("created_at", sinceIso),
    ]);

    ordersList = (ordersRes.data ?? []) as OrderRow[];
    newCustomersCount = customersRes.count ?? 0;
    orderItemRows = (itemsRes.data ?? []) as unknown as OrderItemRow[];

    const carts = cartsRes.data ?? [];
    cartsTotal = carts.length;
    cartsConverted = carts.filter((c) => c.status === "converted").length;
  }

  const revenue = ordersList.reduce((sum, order) => sum + Number(order.total), 0);
  const orderCount = ordersList.length;
  const averageBasket = orderCount > 0 ? revenue / orderCount : 0;
  const conversionRate = cartsTotal > 0 ? (cartsConverted / cartsTotal) * 100 : null;

  const statusCounts: Record<string, number> = {};
  for (const order of ordersList) {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
  }

  const useMonthlyBuckets = period > 90;
  const chartData: { date: string; revenue: number }[] = [];

  if (useMonthlyBuckets) {
    const monthsBack = Math.ceil(period / 30);
    const revenueByMonth = new Map<string, number>();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const month = new Date();
      month.setDate(1);
      month.setMonth(month.getMonth() - i);
      revenueByMonth.set(toMonthKey(month), 0);
    }
    for (const order of ordersList) {
      const key = order.created_at.slice(0, 7);
      if (revenueByMonth.has(key)) {
        revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(order.total));
      }
    }
    for (const [key, value] of revenueByMonth.entries()) {
      chartData.push({ date: monthLabelFormatter.format(new Date(`${key}-01`)), revenue: value });
    }
  } else {
    const revenueByDay = new Map<string, number>();
    for (let i = period - 1; i >= 0; i--) {
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
    for (const [key, value] of revenueByDay.entries()) {
      chartData.push({ date: dayLabelFormatter.format(new Date(key)), revenue: value });
    }
  }

  const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const row of orderItemRows) {
    if (!row.product) continue;
    const existing = productTotals.get(row.product.id);
    productTotals.set(row.product.id, {
      name: row.product.name,
      quantity: (existing?.quantity ?? 0) + row.quantity,
      revenue: (existing?.revenue ?? 0) + row.quantity * Number(row.unit_price),
    });
  }
  const topProducts = Array.from(productTotals.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Chiffre d'affaires, conversion et performance des ventes."
        action={<PeriodSelector current={period} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Chiffre d'affaires"
          value={currencyFormatter.format(revenue)}
          hint={`${period} derniers jours`}
          icon={TrendingUp}
        />
        <KpiCard
          label="Commandes"
          value={orderCount.toString()}
          hint={`${period} derniers jours`}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Panier moyen"
          value={orderCount > 0 ? currencyFormatter.format(averageBasket) : "—"}
          hint={`${period} derniers jours`}
          icon={BarChart3}
        />
        <KpiCard
          label="Nouveaux clients"
          value={newCustomersCount.toString()}
          hint={`${period} derniers jours`}
          icon={Users}
        />
        <KpiCard
          label="Conversion panier → commande"
          value={conversionRate !== null ? `${conversionRate.toFixed(0)} %` : "—"}
          hint={
            cartsTotal > 0
              ? `${cartsConverted}/${cartsTotal} paniers convertis`
              : "Aucun panier sur la période"
          }
          icon={TrendingUp}
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
            <h2 className="text-sm font-semibold text-slate-900">Commandes par statut</h2>
          </CardHeader>
          <CardContent>
            <OrderStatusBreakdown counts={statusCounts} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Meilleures ventes</h2>
          </CardHeader>
          <CardContent>
            <TopProducts products={topProducts} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
