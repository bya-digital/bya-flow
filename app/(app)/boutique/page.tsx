import { Store } from "lucide-react";
import { StoreForm } from "@/components/boutique/StoreForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  return (
    <>
      <PageHeader
        title="Boutique"
        description="Configuration et personnalisation de votre boutique en ligne."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Boutique mise à jour" />
        </div>
      )}

      {store ? (
        <Card className="max-w-2xl">
          <CardContent>
            <StoreForm store={store} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Store}
          title="Aucune boutique trouvée"
          description="Reprenez l'onboarding pour créer votre première boutique."
        />
      )}
    </>
  );
}
