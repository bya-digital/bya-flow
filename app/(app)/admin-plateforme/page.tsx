import { Building2, CreditCard, Store, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { PlanChangeForm } from "@/components/admin-plateforme/PlanChangeForm";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPlan } from "@/lib/billing/plans";
import { getPlatformOverview, isPlatformAdmin } from "@/lib/data/platformAdmin";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const planTone: Record<string, "neutral" | "brand" | "success"> = {
  free: "neutral",
  starter: "brand",
  pro: "brand",
  business: "success",
};

export default async function AdminPlateformePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const authorized = await isPlatformAdmin();
  if (!authorized) notFound();

  const overview = await getPlatformOverview();

  return (
    <>
      <PageHeader
        title="Admin Plateforme"
        description="Vue d'ensemble réservée à BYA Digital sur l'ensemble des organisations clientes."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.success && (
        <Alert tone="success" title="Plan mis à jour" className="mb-6" />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Clients"
          value={overview.totalOrganizations.toString()}
          hint="Organisations créées"
          icon={Building2}
        />
        <KpiCard
          label="Boutiques"
          value={overview.totalStores.toString()}
          hint="Toutes organisations confondues"
          icon={Store}
        />
        <KpiCard
          label="MRR estimé"
          value={currencyFormatter.format(overview.mrr)}
          hint="Somme des plans actifs"
          icon={CreditCard}
        />
        <KpiCard
          label="Plan le plus utilisé"
          value={getPlan(mostUsedPlan(overview.planBreakdown)).name}
          hint={`${overview.planBreakdown[mostUsedPlan(overview.planBreakdown)] ?? 0} client(s)`}
          icon={Users}
        />
      </div>

      <div className="mt-6">
        {overview.organizations.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucun client"
            description="Les organisations créées via l'onboarding apparaîtront ici."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Créée le</th>
                  <th className="px-4 py-3">Membres</th>
                  <th className="px-4 py-3">Boutiques</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{org.name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {dateFormatter.format(new Date(org.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{org.memberCount}</td>
                    <td className="px-4 py-3 text-slate-500">{org.storeCount}</td>
                    <td className="px-4 py-3">
                      <Badge tone={planTone[org.plan] ?? "neutral"}>{getPlan(org.plan).name}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <PlanChangeForm organizationId={org.id} currentPlan={org.plan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function mostUsedPlan(breakdown: Record<string, number>): string {
  let best = "free";
  let bestCount = -1;
  for (const [plan, count] of Object.entries(breakdown)) {
    if (count > bestCount) {
      best = plan;
      bestCount = count;
    }
  }
  return best;
}
