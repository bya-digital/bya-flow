import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/commandes/OrderStatusForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface OrderItemRow {
  id: string;
  quantity: number;
  unit_price: number;
  products: { name: string } | null;
}

export default async function CommandeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*, customers(id, full_name)").eq("id", params.id).maybeSingle(),
    supabase
      .from("order_items")
      .select("id, quantity, unit_price, products(name)")
      .eq("order_id", params.id),
  ]);

  if (!order) notFound();

  const customer = order.customers as { id: string; full_name: string } | null;

  return (
    <>
      <PageHeader title={`Commande #${order.order_number}`} description="Détail de la commande." />

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Produits commandés</h2>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    <th className="pb-2">Produit</th>
                    <th className="pb-2">Quantité</th>
                    <th className="pb-2">Prix unitaire</th>
                    <th className="pb-2">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {((items ?? []) as unknown as OrderItemRow[]).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2">{item.products?.name ?? "Produit supprimé"}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">{Number(item.unit_price).toFixed(2)} €</td>
                      <td className="py-2">
                        {(Number(item.unit_price) * item.quantity).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-right text-base font-semibold text-slate-900">
                Total : {Number(order.total).toFixed(2)} €
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Statut & livraison</h2>
            </CardHeader>
            <CardContent>
              <OrderStatusForm
                orderId={order.id}
                status={order.status}
                paymentStatus={order.payment_status}
                notes={order.notes}
                shippingAddress={order.shipping_address}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Client</h2>
            </CardHeader>
            <CardContent>
              {customer ? (
                <Link
                  href={`/clients/${customer.id}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {customer.full_name}
                </Link>
              ) : (
                <p className="text-sm text-slate-400">Aucun client associé.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
