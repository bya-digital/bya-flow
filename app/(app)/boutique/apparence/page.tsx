import { StoreAppearanceForm } from "@/components/boutique/StoreAppearanceForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Palette } from "lucide-react";
import { getCurrentStore } from "@/lib/data/store";
import { getCurrentMembership, hasPermission } from "@/lib/data/team";

export default async function BoutiqueApparencePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const [store, membership] = await Promise.all([getCurrentStore(), getCurrentMembership()]);
  const canManageSettings = hasPermission(membership, "settings");

  return (
    <>
      <PageHeader
        title="Apparence"
        description="Personnalisez la vitrine que voient vos visiteurs."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Apparence mise à jour" />
        </div>
      )}

      {!store ? (
        <EmptyState
          icon={Palette}
          title="Aucune boutique trouvée"
          description="Reprenez l'onboarding pour créer votre première boutique."
        />
      ) : !canManageSettings ? (
        <Alert
          tone="warning"
          title="Accès restreint"
          description="Vous n'avez pas le droit de modifier les réglages de cette boutique — contactez un administrateur."
        />
      ) : (
        <Card className="max-w-2xl">
          <CardContent>
            <StoreAppearanceForm store={store} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
