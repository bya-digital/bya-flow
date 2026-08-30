import { Building2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptInvitation } from "@/lib/actions/team";
import { getInvitationPreview } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  member: "Membre",
};

export default async function RejoindrePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const invitation = await getInvitationPreview(params.token);
  if (!invitation) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isRealUser = Boolean(user?.email);

  const redirectTarget = `/rejoindre/${params.token}`;

  return (
    <Card>
      <CardContent className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <Building2 className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Rejoindre {invitation.organizationName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vous avez été invité(e) en tant que{" "}
            <strong>{roleLabels[invitation.role] ?? invitation.role}</strong> sur BYA Flow.
          </p>
        </div>

        {searchParams.error && (
          <Alert tone="danger" title="Impossible d'accepter" description={searchParams.error} />
        )}

        {invitation.status !== "pending" ? (
          <Alert
            tone="info"
            title="Invitation déjà traitée"
            description="Cette invitation a déjà été acceptée ou annulée."
          />
        ) : !isRealUser ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Connectez-vous avec <strong>{invitation.email}</strong> ou créez un compte pour
              accepter.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
                className="flex-1"
              >
                <Button variant="secondary" className="w-full">
                  Se connecter
                </Button>
              </Link>
              <Link
                href={`/signup?redirect=${encodeURIComponent(redirectTarget)}`}
                className="flex-1"
              >
                <Button className="w-full">Créer un compte</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form action={acceptInvitation}>
            <input type="hidden" name="token" value={params.token} />
            <Button type="submit" className="w-full">
              Accepter l&apos;invitation
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
