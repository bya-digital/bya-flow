import { Mail, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { InviteMemberForm } from "@/components/equipe/InviteMemberForm";
import { MemberRow } from "@/components/equipe/MemberRow";
import { RevokeInvitationButton } from "@/components/equipe/RevokeInvitationButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentMembership, getPendingInvitations, getTeamMembers } from "@/lib/data/team";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  member: "Membre",
};

export default async function EquipePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) notFound();

  // Contrôle d'accès réel : un membre simple ne peut pas gérer l'équipe,
  // même en accédant directement à /equipe.
  if (membership.role === "member") notFound();

  const [members, invitations] = await Promise.all([
    getTeamMembers(membership.organizationId),
    getPendingInvitations(membership.organizationId),
  ]);

  return (
    <>
      <PageHeader
        title="Équipe"
        description="Invitez des collègues et gérez leurs droits d'accès."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.success === "invite" && (
        <Alert
          tone="success"
          title="Invitation envoyée"
          description="Partagez le lien avec la personne invitée (par email, WhatsApp...) : elle apparaît ci-dessous, en attente."
          className="mb-6"
        />
      )}

      <Card className="mb-6">
        <CardContent>
          <h2 className="text-sm font-semibold text-slate-900">Inviter un membre</h2>
          <p className="mt-1 text-sm text-slate-500">
            Un compte administrateur peut gérer les produits, commandes et paramètres. Un membre a
            accès à l&apos;espace de travail sans pouvoir gérer l&apos;équipe.
          </p>
          <div className="mt-4">
            <InviteMemberForm />
          </div>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h2 className="text-sm font-semibold text-slate-900">Invitations en attente</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{invitation.email}</p>
                      <p className="text-xs text-slate-500">
                        {roleLabels[invitation.role]} · invité le{" "}
                        {dateFormatter.format(new Date(invitation.createdAt))}
                      </p>
                    </div>
                  </div>
                  <RevokeInvitationButton invitationId={invitation.id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {members.length === 0 ? (
        <EmptyState icon={Users} title="Aucun membre" description="Votre équipe apparaîtra ici." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
