import { Sparkles } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
}

export function RecommendationsPanel({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  return (
    <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-slate-900">BYA Flow recommande</h2>
      </div>

      {recommendations.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          Vos recommandations de croissance apparaîtront ici dès que votre boutique
          aura des produits, des commandes et des clients à analyser.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {recommendations.map((recommendation) => (
            <li key={recommendation.id} className="text-sm">
              <p className="font-medium text-slate-900">{recommendation.title}</p>
              <p className="text-slate-600">{recommendation.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
