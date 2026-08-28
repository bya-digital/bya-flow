import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

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

export default async function ParametresPage() {
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
    </>
  );
}
