import { CreditCard } from "lucide-react";
import { PlanCard } from "@/components/facturation/PlanCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PLANS, formatLimit } from "@/lib/billing/plans";
import { getSubscriptionSummary } from "@/lib/data/subscription";

export default async function FacturationPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const summary = await getSubscriptionSummary();

  return (
    <>
      <PageHeader title="Facturation" description="Abonnement, plan et moyens de paiement." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Plan mis à jour" />
        </div>
      )}

      {summary && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Votre abonnement</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold text-slate-900">{summary.plan.name}</span>
              <Badge tone={summary.status === "active" ? "success" : "neutral"}>
                {summary.status === "active" ? "Actif" : summary.status}
              </Badge>
              <span className="text-xs text-slate-400">
                depuis le {new Date(summary.since).toLocaleDateString("fr-FR")}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Produits
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {summary.productsUsed} / {formatLimit(summary.plan.maxProducts)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Commandes ce mois-ci
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {summary.ordersUsedThisMonth} / {formatLimit(summary.plan.maxOrdersPerMonth)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Membres d&apos;équipe
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {summary.teamMembersUsed} / {formatLimit(summary.plan.maxTeamMembers)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Changer de plan</h2>
      <p className="mb-4 text-xs text-slate-500">
        Aucun moyen de paiement n&apos;est connecté à ce stade : changer de plan est
        immédiat et gratuit.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} isCurrent={summary?.plan.id === plan.id} />
        ))}
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Historique de facturation</h2>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CreditCard}
              title="Aucune facture"
              description="Aucun moyen de paiement n'est encore connecté : il n'y a rien à facturer pour l'instant."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
