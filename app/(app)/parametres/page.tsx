import { updateEmail, updatePassword } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createClient } from "@/lib/supabase/server";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ecommerce: "Boutique en ligne",
  services: "Services",
  infopreneur: "Infopreneur / formation",
  artisanat: "Artisanat / fait-main",
  autre: "Autre",
};

const GOAL_LABELS: Record<string, string> = {
  vendre_plus: "Vendre plus",
  trouver_clients: "Trouver plus de clients",
  automatiser_marketing: "Automatiser mon marketing",
  ameliorer_conversions: "Améliorer mes conversions",
  developper_boutique: "Développer ma boutique",
};

interface OrganizationSummary {
  name: string;
  business_type: string | null;
  currency: string;
  country: string | null;
  primary_goal: string | null;
}

interface MembershipRow {
  role: string;
  organizations: OrganizationSummary | null;
}

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string; success?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations(name, business_type, currency, country, primary_goal)")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle<MembershipRow>();

  const organization = membership?.organizations ?? undefined;

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Informations générales de votre organisation."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.message && (
        <Alert tone="info" title="Vérifiez votre boîte mail" description={searchParams.message} className="mb-6" />
      )}
      {searchParams.success === "password" && (
        <Alert tone="success" title="Mot de passe mis à jour" className="mb-6" />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Organisation</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Nom</dt>
                <dd className="font-medium text-slate-900">{organization?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Type d&apos;activité</dt>
                <dd className="font-medium text-slate-900">
                  {organization?.business_type
                    ? BUSINESS_TYPE_LABELS[organization.business_type] ??
                      organization.business_type
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Devise</dt>
                <dd className="font-medium text-slate-900">{organization?.currency ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Pays</dt>
                <dd className="font-medium text-slate-900">{organization?.country ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Objectif principal</dt>
                <dd className="font-medium text-slate-900">
                  {organization?.primary_goal
                    ? GOAL_LABELS[organization.primary_goal] ?? organization.primary_goal
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Profil</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Rôle</dt>
                <dd className="font-medium capitalize text-slate-900">
                  {membership?.role ?? "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Changer d&apos;email</h2>
            <form action={updateEmail} className="space-y-4">
              <input type="hidden" name="redirect" value="/parametres" />
              <div>
                <label htmlFor="email" className={labelClasses}>
                  Nouvelle adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={user?.email ?? ""}
                  className={inputClasses}
                />
              </div>
              <p className="text-xs text-slate-500">
                Un email de confirmation sera envoyé à la nouvelle adresse avant que le
                changement ne prenne effet.
              </p>
              <SubmitButton pendingText="Envoi...">Mettre à jour l&apos;email</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Changer de mot de passe</h2>
            <form action={updatePassword} className="space-y-4">
              <input type="hidden" name="redirect" value="/parametres" />
              <input type="hidden" name="errorRedirect" value="/parametres" />
              <div>
                <label htmlFor="password" className={labelClasses}>
                  Nouveau mot de passe
                </label>
                <PasswordInput id="password" name="password" required minLength={6} className={inputClasses} />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClasses}>
                  Confirmer le mot de passe
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={6}
                  className={inputClasses}
                />
              </div>
              <SubmitButton pendingText="Mise à jour...">Mettre à jour le mot de passe</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
