import { ShippingMethodForm } from "@/components/livraison/ShippingMethodForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createShippingMethod } from "@/lib/actions/shipping";

export default function NouvelleMethodeLivraisonPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <PageHeader
        title="Nouvelle méthode de livraison"
        description="Définissez son nom, son prix et une éventuelle gratuité."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <ShippingMethodForm action={createShippingMethod} />
        </CardContent>
      </Card>
    </>
  );
}
