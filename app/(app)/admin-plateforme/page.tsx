import { Building2, CreditCard, Globe, Store, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { PlanChangeForm } from "@/components/admin-plateforme/PlanChangeForm";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { verifyCustomDomain } from "@/lib/actions/platformAdmin";
import { getPlan } from "@/lib/billing/plans";
import {
  getPendingCustomDomains,
  getPlatformOverview,
  isPlatformAdmin,
} from "@/lib/data/platformAdmin";

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
  const pendingDomains = await getPendingCustomDomains();

  return (
    <>
      <PageHeader
        title="Admin Plateforme"
        description="Vue d'ensemble réservée à BYA Digital sur l'ensemble des organisations clientes."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.success === "domain" && (
        <Alert tone="success" title="Domaine marqué vérifié" className="mb-6" />
      )}
      {searchParams.success && searchParams.success !== "domain" && (
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

      {pendingDomains.length > 0 && (
        <Card className="mt-6">
          <CardContent>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Globe className="h-4 w-4" /> Domaines personnalisés en attente
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Ajoutez chaque domaine ci-dessous dans Vercel (Projet bya-flow → Settings → Domains)
              avant de le marquer vérifié.
            </p>
            <ul className="mt-3 divide-y divide-slate-100">
              {pendingDomains.map((pending) => (
                <li key={pending.storeId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{pending.domain}</p>
                    <p className="text-xs text-slate-500">{pending.storeName}</p>
                  </div>
                  <form action={verifyCustomDomain}>
                    <input type="hidden" name="storeId" value={pending.storeId} />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Marquer comme vérifié
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
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
