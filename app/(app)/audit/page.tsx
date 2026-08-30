import { ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getRecentActivity, type ActivityLogEntry } from "@/lib/data/activity";
import { getCurrentMembership } from "@/lib/data/team";

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

function describeAction(entry: ActivityLogEntry): string {
  const role = typeof entry.metadata.role === "string" ? roleLabels[entry.metadata.role] : undefined;
  const newRole =
    typeof entry.metadata.new_role === "string" ? roleLabels[entry.metadata.new_role] : undefined;
  const target = entry.targetLabel ?? "quelqu'un";

  switch (entry.action) {
    case "invitation.created":
      return `a invité ${target}${role ? ` (${role})` : ""}`;
    case "invitation.accepted":
      return `${target} a rejoint l'équipe`;
    case "invitation.revoked":
      return `a annulé l'invitation de ${target}`;
    case "member.role_updated":
      return `a changé le rôle de ${target}${newRole ? ` en ${newRole}` : ""}`;
    case "member.removed":
      return `a retiré ${target} de l'équipe`;
    default:
      return entry.action;
  }
}

export default async function AuditPage() {
  const membership = await getCurrentMembership();
  if (!membership) notFound();
  if (membership.role === "member") notFound();

  const entries = await getRecentActivity(membership.organizationId);

  return (
    <>
      <PageHeader
        title="Sécurité & audit"
        description="Journal des actions récentes sur votre équipe."
      />

      <Alert
        tone="info"
        className="mb-6"
        title="Couverture actuelle"
        description="Ce journal trace pour l'instant les actions liées à l'équipe (invitations, rôles, retraits). D'autres modules seront ajoutés progressivement."
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Aucune activité"
          description="Les invitations, changements de rôle et retraits de votre équipe apparaîtront ici."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">
                    {entry.actorName ?? "Quelqu'un"}
                  </span>{" "}
                  {describeAction(entry)}
                </p>
                <span className="shrink-0 text-xs text-slate-400">
                  {dateTimeFormatter.format(new Date(entry.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
