import type { ScoreFactor } from "@/lib/score/calculateScore";

export function ScoreBreakdown({ factors }: { factors: ScoreFactor[] }) {
  return (
    <ul className="space-y-4">
      {factors.map((factor) => (
        <li key={factor.key}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">{factor.label}</span>
            <span className="text-slate-500">{factor.value}/100</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-brand-500"
              style={{ width: `${factor.value}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {factor.hint} · poids {Math.round(factor.weight * 100)}%
          </p>
        </li>
      ))}
    </ul>
  );
}
