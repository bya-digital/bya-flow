import { Badge } from "@/components/ui/Badge";

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  pending: { label: "En attente", tone: "warning" },
  confirmed: { label: "Confirmée", tone: "neutral" },
  processing: { label: "En préparation", tone: "neutral" },
  shipped: { label: "Expédiée", tone: "neutral" },
  delivered: { label: "Livrée", tone: "success" },
  cancelled: { label: "Annulée", tone: "danger" },
  refunded: { label: "Remboursée", tone: "danger" },
};

export function OrderStatusBreakdown({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">Aucune commande sur la période.</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map(([status, count]) => {
        const meta = STATUS_LABELS[status] ?? { label: status, tone: "neutral" as const };
        return (
          <li key={status} className="flex items-center justify-between text-sm">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <span className="font-medium text-slate-900">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
