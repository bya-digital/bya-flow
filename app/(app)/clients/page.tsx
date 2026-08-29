import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { getCurrentStore } from "@/lib/data/store";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

interface CustomerRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  tags: string[];
}

interface OrderAgg {
  customer_id: string | null;
  total: number;
  created_at: string;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const store = await getCurrentStore();
  const page = parsePage(searchParams.page);

  let customers: CustomerRow[] = [];
  let totalCount = 0;
  const spentByCustomer = new Map<string, number>();
  const lastOrderByCustomer = new Map<string, string>();

  if (store) {
    const supabase = createClient();
    const { data: customersData, count } = await supabase
      .from("customers")
      .select("id, full_name, email, phone, status, tags", { count: "exact" })
      .eq("organization_id", store.organization_id)
      .order("created_at", { ascending: false })
      .range(...pageRange(page));

    customers = customersData ?? [];
    totalCount = count ?? 0;

    const customerIds = customers.map((customer) => customer.id);
    if (customerIds.length > 0) {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("customer_id, total, created_at")
        .eq("store_id", store.id)
        .in("customer_id", customerIds);

      for (const order of (ordersData ?? []) as OrderAgg[]) {
        if (!order.customer_id) continue;
        spentByCustomer.set(
          order.customer_id,
          (spentByCustomer.get(order.customer_id) ?? 0) + Number(order.total)
        );
        const current = lastOrderByCustomer.get(order.customer_id);
        if (!current || order.created_at > current) {
          lastOrderByCustomer.set(order.customer_id, order.created_at);
        }
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Clients & CRM"
        description="Fiches clients, prospects, segments et historique."
        action={
          <Link
            href="/clients/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau client
          </Link>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          description="Ajoutez un prospect ou un client pour démarrer votre CRM."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dépensé</th>
                <th className="px-4 py-3">Dernière commande</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${customer.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {customer.full_name}
                    </Link>
                    {customer.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {customer.tags.map((tag) => (
                          <Badge key={tag} tone="neutral">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>{customer.email ?? "—"}</div>
                    <div>{customer.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={customer.status === "client" ? "success" : "warning"}>
                      {customer.status === "client" ? "Client" : "Prospect"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {(spentByCustomer.get(customer.id) ?? 0).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {lastOrderByCustomer.get(customer.id)
                      ? new Date(lastOrderByCustomer.get(customer.id)!).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} basePath="/clients" />
        </div>
      )}
    </>
  );
}
