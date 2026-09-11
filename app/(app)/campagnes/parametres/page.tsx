import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { saveEmailProviderSettings } from "@/lib/actions/emailSettings";
import { getCurrentMembership } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

export default async function CampagnesParametresPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const membership = await getCurrentMembership();
  const canManage = membership?.role !== "member";

  let settings: {
    resend_api_key: string | null;
    sender_email: string | null;
    sender_name: string | null;
    is_active: boolean;
  } | null = null;

  if (membership && canManage) {
    const supabase = createClient();
    const { data } = await supabase
      .from("email_provider_settings")
      .select("resend_api_key, sender_email, sender_name, is_active")
      .eq("organization_id", membership.organizationId)
      .maybeSingle();
    settings = data;
  }

  const isConfigured = Boolean(settings?.resend_api_key);

  return (
    <>
      <PageHeader
        title="Envoi d'emails"
        description="Connectez votre compte Resend pour envoyer réellement vos campagnes."
      />

      <div className="mb-4">
        <Link href="/campagnes" className="text-sm font-medium text-brand-600 hover:underline">
          ← Campagnes
        </Link>
      </div>

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Paramètres enregistrés" />
        </div>
      )}

      {!canManage ? (
        <Alert
          tone="warning"
          title="Accès réservé"
          description="Seuls les administrateurs de l'organisation peuvent configurer l'envoi d'emails."
        />
      ) : (
        <Card className="max-w-xl">
          <CardContent>
            <Alert
              tone={settings?.is_active ? "success" : "info"}
              title={
                settings?.is_active
                  ? "Envoi réel activé"
                  : "Envoi simulé (aucun provider actif)"
              }
              description={
                settings?.is_active
                  ? "Vos campagnes email sont réellement envoyées via Resend."
                  : "Sans clé Resend active, vos campagnes restent enregistrées mais aucun message n'est réellement envoyé — jamais un faux envoi."
              }
              className="mb-4"
            />

            <form action={saveEmailProviderSettings} className="space-y-4">
              <div>
                <label htmlFor="resendApiKey" className="text-sm font-medium text-slate-700">
                  Clé API Resend
                </label>
                <input
                  id="resendApiKey"
                  name="resendApiKey"
                  type="password"
                  placeholder={isConfigured ? "••••••••" : "re_..."}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="senderEmail" className="text-sm font-medium text-slate-700">
                  Adresse d&apos;expédition
                </label>
                <input
                  id="senderEmail"
                  name="senderEmail"
                  type="email"
                  defaultValue={settings?.sender_email ?? ""}
                  placeholder="contact@votreboutique.com"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Doit appartenir à un domaine vérifié dans votre compte Resend.
                </p>
              </div>
              <div>
                <label htmlFor="senderName" className="text-sm font-medium text-slate-700">
                  Nom d&apos;expéditeur
                </label>
                <input
                  id="senderName"
                  name="senderName"
                  defaultValue={settings?.sender_name ?? ""}
                  placeholder="Votre Boutique"
                  className={inputClasses}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={settings?.is_active ?? false}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                />
                Activer l&apos;envoi réel
              </label>

              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
