import { Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { CopyAffiliateLink } from "@/components/affiliation/CopyAffiliateLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createAffiliate, deleteAffiliate, toggleAffiliate } from "@/lib/actions/affiliates";
import { getAffiliatesWithStats } from "@/lib/data/affiliates";
import { getCurrentStore } from "@/lib/data/store";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

export default async function AffiliationPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  const affiliates = store ? await getAffiliatesWithStats(store.id) : [];

  const currencyFormatter = store
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: store.currency })
    : null;

  return (
    <>
      <PageHeader
        title="Programme d'affiliation"
        description="Des partenaires externes gagnent une commission réelle sur les ventes qu'ils apportent via leur lien unique."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Affilié créé" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {affiliates.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun affilié"
              description="Ajoutez votre premier partenaire pour générer son lien de suivi."
            />
          ) : (
            affiliates.map((affiliate) => (
              <div
                key={affiliate.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{affiliate.fullName}</p>
                    <p className="text-xs text-slate-500">{affiliate.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={affiliate.status === "active" ? "success" : "neutral"}>
                      {affiliate.status === "active" ? "Actif" : "Suspendu"}
                    </Badge>
                    <form action={toggleAffiliate}>
                      <input type="hidden" name="affiliateId" value={affiliate.id} />
                      <input type="hidden" name="status" value={affiliate.status} />
                      <Button type="submit" variant="secondary" size="sm">
                        {affiliate.status === "active" ? "Suspendre" : "Réactiver"}
                      </Button>
                    </form>
                    <form action={deleteAffiliate}>
                      <input type="hidden" name="affiliateId" value={affiliate.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Supprimer
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Commission</p>
                    <p className="font-medium text-slate-900">{affiliate.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Commandes apportées</p>
                    <p className="font-medium text-slate-900">{affiliate.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Commission due</p>
                    <p className="font-medium text-slate-900">
                      {currencyFormatter?.format(affiliate.totalCommission) ?? affiliate.totalCommission}
                    </p>
                  </div>
                </div>

                {store && (
                  <CopyAffiliateLink
                    className="mt-3"
                    url={`${process.env.NEXT_PUBLIC_SITE_URL || "https://bya-flow.vercel.app"}/store/${store.slug}?aff=${affiliate.code}`}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Nouvel affilié</h2>
          </CardHeader>
          <CardContent>
            <form action={createAffiliate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Nom complet</label>
                <input name="fullName" required className={inputClasses} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Email</label>
                <input name="email" type="email" required className={inputClasses} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Taux de commission (%)</label>
                <input
                  name="commissionRate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={10}
                  required
                  className={inputClasses}
                />
              </div>
              <Button type="submit">Créer l&apos;affilié</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
