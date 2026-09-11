import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { SEGMENT_LABELS, getCustomerRfmMap, type CustomerRfm, type CustomerSegment } from "@/lib/data/crm";
import { getCurrentStore } from "@/lib/data/store";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

interface CustomerRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  tags: string[];
}

const SEGMENT_BADGE_TONE: Record<CustomerSegment, "brand" | "success" | "warning" | "neutral"> = {
  new: "brand",
  vip: "success",
  at_risk: "warning",
  inactive: "neutral",
  active: "neutral",
};

const SEGMENT_FILTERS: { value: CustomerSegment | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "new", label: "Nouveaux" },
  { value: "vip", label: "VIP" },
  { value: "at_risk", label: "À risque" },
  { value: "inactive", label: "Inactifs" },
  { value: "active", label: "Actifs" },
];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { page?: string; segment?: string };
}) {
  const store = await getCurrentStore();
  const page = parsePage(searchParams.page);
  const segmentFilter = searchParams.segment as CustomerSegment | "all" | undefined;

  let allCustomers: CustomerRow[] = [];
  let rfmMap = new Map<string, CustomerRfm>();

  if (store) {
    const supabase = createClient();
    const [{ data: customersData }, rfm] = await Promise.all([
      supabase
        .from("customers")
        .select("id, full_name, email, phone, status, tags")
        .eq("organization_id", store.organization_id)
        .order("created_at", { ascending: false })
        .limit(2000),
      getCustomerRfmMap(store.id),
    ]);
    allCustomers = customersData ?? [];
    rfmMap = rfm;
  }

  const segmentCounts: Record<CustomerSegment, number> = {
    new: 0,
    vip: 0,
    at_risk: 0,
    inactive: 0,
    active: 0,
  };
  for (const rfm of rfmMap.values()) {
    segmentCounts[rfm.segment]++;
  }

  const filteredCustomers =
    !segmentFilter || segmentFilter === "all"
      ? allCustomers
      : allCustomers.filter((c) => rfmMap.get(c.id)?.segment === segmentFilter);

  const totalCount = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const [rangeStart, rangeEnd] = pageRange(page);
  const customers = filteredCustomers.slice(rangeStart, rangeEnd + 1);

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store?.currency ?? "EUR",
  });

  return (
    <>
      <PageHeader
        title="Clients & CRM"
        description="Fiches clients, segments dynamiques (RFM) et historique."
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

      <div className="mb-4 flex flex-wrap gap-2">
        {SEGMENT_FILTERS.map((filter) => {
          const active = (segmentFilter ?? "all") === filter.value;
          const count = filter.value === "all" ? allCustomers.length : segmentCounts[filter.value];
          return (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/clients" : `/clients?segment=${filter.value}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                active
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {filter.label} ({count})
            </Link>
          );
        })}
      </div>

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
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Dépensé</th>
                <th className="px-4 py-3">Commandes</th>
                <th className="px-4 py-3">Dernière commande</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => {
                const rfm = rfmMap.get(customer.id);
                return (
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
                      {rfm ? (
                        <Badge tone={SEGMENT_BADGE_TONE[rfm.segment]}>
                          {SEGMENT_LABELS[rfm.segment]}
                        </Badge>
                      ) : (
                        <Badge tone={customer.status === "client" ? "success" : "warning"}>
                          {customer.status === "client" ? "Client" : "Prospect"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {currencyFormatter.format(rfm?.totalSpent ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{rfm?.orderCount ?? 0}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {rfm?.lastOrderAt
                        ? new Date(rfm.lastOrderAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} basePath="/clients" />
        </div>
      )}
    </>
  );
}
