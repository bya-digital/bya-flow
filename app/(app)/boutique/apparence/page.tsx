import { StoreAppearanceForm } from "@/components/boutique/StoreAppearanceForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Palette } from "lucide-react";
import { getCurrentStore } from "@/lib/data/store";

export default async function BoutiqueApparencePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

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

      {store ? (
        <Card className="max-w-2xl">
          <CardContent>
            <StoreAppearanceForm store={store} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Palette}
          title="Aucune boutique trouvée"
          description="Reprenez l'onboarding pour créer votre première boutique."
        />
      )}
    </>
  );
}
