import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export function KpiCard({ label, value, hint, icon: Icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </CardContent>
    </Card>
  );
}
