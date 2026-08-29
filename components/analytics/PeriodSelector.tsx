import Link from "next/link";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
  { value: 365, label: "12 mois" },
];

export function PeriodSelector({ current }: { current: number }) {
  return (
    <div className="flex gap-2">
      {PERIODS.map((period) => (
        <Link
          key={period.value}
          href={`/analytics?period=${period.value}`}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            current === period.value
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          )}
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}
