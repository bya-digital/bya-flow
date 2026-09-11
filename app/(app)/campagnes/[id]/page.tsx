import { Users } from "lucide-react";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/campagnes/CampaignForm";
import { DeleteCampaignButton } from "@/components/campagnes/DeleteCampaignButton";
import { SendCampaignButton } from "@/components/campagnes/SendCampaignButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { updateCampaign } from "@/lib/actions/campaigns";
import { createClient } from "@/lib/supabase/server";

export default async function CampagneDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; success?: string; sent?: string; real?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!campaign) notFound();

  const { count: recipientCount } = await supabase
    .from("campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", params.id);

  const { count: sentCount } = await supabase
    .from("campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", params.id)
    .eq("status", "sent");

  const { count: failedCount } = await supabase
    .from("campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", params.id)
    .eq("status", "failed");

  const wasRealSend = (sentCount ?? 0) > 0 || (failedCount ?? 0) > 0;

  const { data: providerSettings } = await supabase
    .from("email_provider_settings")
    .select("resend_api_key, sender_email, is_active")
    .eq("organization_id", store.organization_id)
    .maybeSingle<{ resend_api_key: string | null; sender_email: string | null; is_active: boolean }>();

  const willSendReal =
    campaign.channel === "email" &&
    Boolean(providerSettings?.is_active && providerSettings.resend_api_key && providerSettings.sender_email);

  return (
    <>
      <PageHeader title={campaign.name} description="Détail de la campagne." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Modifications enregistrées" />
        </div>
      )}
      {searchParams.sent && searchParams.real === "1" && (
        <div className="mb-4">
          <Alert
            tone="success"
            title="Envoi réel effectué via Resend"
            description={`${sentCount ?? 0} email(s) envoyé(s) avec succès, ${failedCount ?? 0} échec(s), sur ${recipientCount ?? 0} contact(s) ciblé(s).`}
          />
        </div>
      )}
      {searchParams.sent && searchParams.real !== "1" && (
        <div className="mb-4">
          <Alert
            tone="info"
            title="Envoi simulé"
            description={`${recipientCount ?? 0} contact(s) ciblé(s) et enregistré(s). Aucun message réel n'a été envoyé (aucun fournisseur email actif — configurez Resend dans Paramètres d'envoi).`}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Contenu</h2>
            </CardHeader>
            <CardContent>
              <CampaignForm action={updateCampaign} campaign={campaign} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Envoi</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.status === "sent" ? (
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {recipientCount ?? 0} destinataire(s) ciblé(s)
                  </div>
                  {wasRealSend && (
                    <p className="text-xs text-slate-500">
                      {sentCount ?? 0} réellement envoyé(s) via Resend, {failedCount ?? 0} échec(s)
                    </p>
                  )}
                  {!wasRealSend && (
                    <p className="text-xs text-slate-500">
                      Envoi simulé — aucun fournisseur email actif.
                    </p>
                  )}
                </div>
              ) : (
                <SendCampaignButton campaignId={campaign.id} isRealSend={willSendReal} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Zone dangereuse</h2>
            </CardHeader>
            <CardContent>
              <DeleteCampaignButton campaignId={campaign.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
