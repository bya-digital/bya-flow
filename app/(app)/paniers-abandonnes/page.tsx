import { Plus, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" }> = {
  active: { label: "Actif", tone: "neutral" },
  abandoned: { label: "Abandonné", tone: "warning" },
  converted: { label: "Converti", tone: "success" },
};

interface CartRow {
  id: string;
  status: string;
  created_at: string;
  last_reminder_at: string | null;
  customers: { full_name: string } | null;
  cart_items: { quantity: number; unit_price: number }[];
}

export default async function PaniersAbandonnesPage() {
  const store = await getCurrentStore();

  let carts: CartRow[] = [];

  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("carts")
      .select("id, status, created_at, last_reminder_at, customers(full_name), cart_items(quantity, unit_price)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    carts = (data ?? []) as unknown as CartRow[];
  }

  return (
    <>
      <PageHeader
        title="Paniers abandonnés"
        description="Détection et relance des paniers non finalisés."
        action={
          <Link
            href="/paniers-abandonnes/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau panier
          </Link>
        }
      />

      {carts.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Aucun panier"
          description="Enregistrez un panier pour suivre une vente en cours et la relancer si besoin."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Dernière relance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carts.map((cart) => {
                const status = STATUS_LABELS[cart.status] ?? STATUS_LABELS.active;
                const total = cart.cart_items.reduce(
                  (sum, item) => sum + Number(item.unit_price) * item.quantity,
                  0
                );
                return (
                  <tr key={cart.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/paniers-abandonnes/${cart.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {cart.customers?.full_name ?? "Client non renseigné"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{total.toFixed(2)} €</td>
                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(cart.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {cart.last_reminder_at
                        ? new Date(cart.last_reminder_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
