import { Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { getCurrentStore } from "@/lib/data/store";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  pending: { label: "En attente", tone: "warning" },
  confirmed: { label: "Confirmée", tone: "neutral" },
  processing: { label: "En préparation", tone: "neutral" },
  shipped: { label: "Expédiée", tone: "neutral" },
  delivered: { label: "Livrée", tone: "success" },
  cancelled: { label: "Annulée", tone: "danger" },
  refunded: { label: "Remboursée", tone: "danger" },
};

const PAYMENT_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" }> = {
  pending: { label: "En attente", tone: "warning" },
  paid: { label: "Payé", tone: "success" },
  refunded: { label: "Remboursé", tone: "neutral" },
};

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  customers: { full_name: string } | null;
}

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const store = await getCurrentStore();
  const page = parsePage(searchParams.page);

  let orders: OrderRow[] = [];
  let totalCount = 0;

  if (store) {
    const supabase = createClient();
    const { data, count } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, created_at, customers(full_name)", {
        count: "exact",
      })
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .range(...pageRange(page));
    orders = (data ?? []) as unknown as OrderRow[];
    totalCount = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Commandes"
        description="Suivi des commandes, statuts et paiements."
        action={
          <Link
            href="/commandes/nouvelle"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Link>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aucune commande"
          description="Créez votre première commande pour commencer à suivre vos ventes."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
                const payment = PAYMENT_LABELS[order.payment_status] ?? PAYMENT_LABELS.pending;
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/commandes/${order.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {order.customers?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{Number(order.total).toFixed(2)} €</td>
                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={payment.tone}>{payment.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} basePath="/commandes" />
        </div>
      )}
    </>
  );
}
