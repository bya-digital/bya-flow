import { Plus, Workflow } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const TRIGGER_LABELS: Record<string, string> = {
  order_created: "Commande créée",
  order_delivered: "Commande livrée",
  cart_abandoned: "Panier abandonné",
  customer_inactive: "Client inactif",
};

export default async function AutomatisationsPage() {
  const store = await getCurrentStore();

  let automations: {
    id: string;
    name: string;
    trigger_type: string;
    is_active: boolean;
  }[] = [];

  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("automations")
      .select("id, name, trigger_type, is_active")
      .eq("organization_id", store.organization_id)
      .order("created_at", { ascending: false });
    automations = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Automatisations"
        description="Déclencheurs, conditions et actions automatiques."
        action={
          <Link
            href="/automatisations/nouvelle"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle automatisation
          </Link>
        }
      />

      {automations.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="Aucune automatisation"
          description="Créez votre première règle pour réagir automatiquement à un événement."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Déclencheur</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {automations.map((automation) => (
                <tr key={automation.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/automatisations/${automation.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {automation.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {TRIGGER_LABELS[automation.trigger_type] ?? automation.trigger_type}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={automation.is_active ? "success" : "neutral"}>
                      {automation.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
