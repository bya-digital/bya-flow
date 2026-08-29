import { Sparkles } from "lucide-react";
import { GrowthScoreGauge } from "@/components/score/GrowthScoreGauge";
import { ScoreBreakdown } from "@/components/score/ScoreBreakdown";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getGrowthScore } from "@/lib/data/growthScore";

export default async function IaPage() {
  const result = await getGrowthScore();

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

      <div className="mt-6 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-slate-900">Opportunités de croissance</h2>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Les recommandations personnalisées basées sur ce score (produit à
          promouvoir, client à réactiver, campagne à optimiser...) arrivent
          avec la couche IA de la Phase 11.
        </p>
      </div>
    </>
  );
}
