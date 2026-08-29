import type { ScoreBand } from "@/lib/score/calculateScore";

const BAND_COLORS: Record<ScoreBand, string> = {
  critique: "#ef4444",
  faible: "#f97316",
  moyen: "#eab308",
  bon: "#22c55e",
  excellent: "#16a34a",
};

export function GrowthScoreGauge({
  score,
  band,
  bandLabel,
  size = 180,
}: {
  score: number;
  band: ScoreBand;
  bandLabel: string;
  size?: number;
}) {
  const radius = (size - 30) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = BAND_COLORS[band];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fontSize={size / 5}
          fontWeight={700}
          fill="#0f172a"
        >
          {score}
        </text>
        <text x={center} y={center + 18} textAnchor="middle" fontSize={size / 14} fill="#64748b">
          / 100
        </text>
      </svg>
      <span
        className="mt-2 rounded-full px-3 py-1 text-sm font-semibold"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {bandLabel}
      </span>
    </div>
  );
}
