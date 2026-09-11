"use client";

import { useEffect, useState } from "react";

function getRemaining(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining>>(null);

  useEffect(() => {
    setRemaining(getRemaining(targetDate));
    const interval = setInterval(() => setRemaining(getRemaining(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!remaining) {
    return <p className="text-sm text-slate-500">Offre expirée.</p>;
  }

  const units: [number, string][] = [
    [remaining.days, "jours"],
    [remaining.hours, "heures"],
    [remaining.minutes, "min"],
    [remaining.seconds, "sec"],
  ];

  return (
    <div className="flex justify-center gap-4">
      {units.map(([value, label]) => (
        <div key={label} className="text-center">
          <div className="rounded-lg bg-slate-900 px-4 py-3 text-2xl font-bold text-white tabular-nums">
            {String(value).padStart(2, "0")}
          </div>
          <p className="mt-1 text-xs text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
