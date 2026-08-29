import { Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/ClientForm";
import { DeleteCustomerButton } from "@/components/clients/DeleteCustomerButton";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { updateCustomer } from "@/lib/actions/customers";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" }> = {
  pending: { label: "En attente", tone: "warning" },
  confirmed: { label: "Confirmée", tone: "neutral" },
  processing: { label: "En préparation", tone: "neutral" },
  shipped: { label: "Expédiée", tone: "neutral" },
  delivered: { label: "Livrée", tone: "success" },
  cancelled: { label: "Annulée", tone: "warning" },
  refunded: { label: "Remboursée", tone: "warning" },
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();

  const [{ data: customer }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("orders")
      .select("id, order_number, status, total, created_at")
      .eq("customer_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!customer) notFound();

  const totalSpent = (orders ?? []).reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <>
      <PageHeader title={customer.full_name} description="Fiche client." />

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
              <h2 className="text-sm font-semibold text-slate-900">Informations</h2>
            </CardHeader>
            <CardContent>
              <ClientForm action={updateCustomer} client={customer} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Historique des commandes</h2>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
                    return (
                      <li key={order.id} className="flex items-center justify-between py-3 text-sm">
                        <Link
                          href={`/commandes/${order.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          #{order.order_number}
                        </Link>
                        <span className="text-slate-500">
                          {new Date(order.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                        <span className="font-medium text-slate-900">
                          {Number(order.total).toFixed(2)} €
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={Package}
                  title="Aucune commande"
                  description="L'historique des commandes de ce client apparaîtra ici."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Statistiques</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Montant dépensé</span>
                <span className="font-medium text-slate-900">{totalSpent.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre de commandes</span>
                <span className="font-medium text-slate-900">{orders?.length ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Zone dangereuse</h2>
            </CardHeader>
            <CardContent>
              <DeleteCustomerButton customerId={customer.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
