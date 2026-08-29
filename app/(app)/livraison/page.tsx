import { Plus, Truck } from "lucide-react";
import Link from "next/link";
import { DeleteShippingMethodButton } from "@/components/livraison/DeleteShippingMethodButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface ShippingMethodRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  free_above: number | null;
  is_active: boolean;
}

export default async function LivraisonPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  let methods: ShippingMethodRow[] = [];

  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("shipping_methods")
      .select("id, name, description, price, free_above, is_active")
      .eq("store_id", store.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    methods = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Livraison"
        description="Méthodes de livraison proposées à vos clients."
        action={
          <Link
            href="/livraison/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle méthode
          </Link>
        }
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Modifications enregistrées" />
        </div>
      )}

      {methods.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Aucune méthode de livraison"
          description="Sans méthode configurée, la livraison est gratuite par défaut au checkout."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Gratuite dès</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {methods.map((method) => (
                <tr key={method.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/livraison/${method.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {method.name}
                    </Link>
                    {method.description && (
                      <p className="text-xs text-slate-400">{method.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {method.price === 0 ? "Gratuite" : `${Number(method.price).toFixed(2)} €`}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {method.free_above ? `${Number(method.free_above).toFixed(2)} €` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={method.is_active ? "success" : "neutral"}>
                      {method.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DeleteShippingMethodButton methodId={method.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
