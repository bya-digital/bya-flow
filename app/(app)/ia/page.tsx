import { Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { GrowthScoreGauge } from "@/components/score/GrowthScoreGauge";
import { ScoreBreakdown } from "@/components/score/ScoreBreakdown";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getGrowthOpportunities } from "@/lib/ai/opportunities";
import { getGrowthScore } from "@/lib/data/growthScore";

export default async function IaPage() {
  const [result, opportunities] = await Promise.all([getGrowthScore(), getGrowthOpportunities()]);

  return (
    <>
      <PageHeader
        title="IA & recommandations"
        description="BYA Flow Score et opportunités de croissance."
      />

      {!result ? (
        <EmptyState
          icon={Sparkles}
          title="Aucune boutique"
          description="Terminez l'onboarding pour calculer votre score."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">BYA Flow Score</h2>
            <GrowthScoreGauge score={result.score} band={result.band} bandLabel={result.bandLabel} />
            <p className="mt-4 text-center text-xs text-slate-400">
              Calculé sur les 30 derniers jours, comparés aux 30 jours précédents.
            </p>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Détail du score</h2>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown factors={result.factors} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-slate-900">Opportunités de croissance</h2>
            </div>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Aucune opportunité détectée"
                description="Dès que votre boutique aura plus d'historique (clients, commandes, produits), des opportunités concrètes apparaîtront ici."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {opportunities.map((opportunity) => (
                  <li key={opportunity.id} className="py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {opportunity.category}
                    </p>
                    <Link
                      href={opportunity.href}
                      className="font-medium text-slate-900 hover:text-brand-600 hover:underline"
                    >
                      {opportunity.title}
                    </Link>
                    <p className="text-sm text-slate-600">{opportunity.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
