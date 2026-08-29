import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" }> = {
  draft: { label: "Brouillon", tone: "warning" },
  scheduled: { label: "Programmée", tone: "neutral" },
  sent: { label: "Envoyée", tone: "success" },
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export default async function CampagnesPage() {
  const store = await getCurrentStore();

  let campaigns: {
    id: string;
    name: string;
    channel: string;
    status: string;
    scheduled_at: string | null;
    sent_at: string | null;
  }[] = [];

  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, channel, status, scheduled_at, sent_at")
      .eq("organization_id", store.organization_id)
      .order("created_at", { ascending: false });
    campaigns = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Campagnes"
        description="Création et suivi de vos campagnes marketing."
        action={
          <Link
            href="/campagnes/nouvelle"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle campagne
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Aucune campagne"
          description="Créez votre première campagne pour toucher vos clients."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Campagne</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Programmée / envoyée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((campaign) => {
                const status = STATUS_LABELS[campaign.status] ?? STATUS_LABELS.draft;
                const date = campaign.sent_at ?? campaign.scheduled_at;
                return (
                  <tr key={campaign.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/campagnes/${campaign.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {CHANNEL_LABELS[campaign.channel] ?? campaign.channel}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {date ? new Date(date).toLocaleString("fr-FR") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
