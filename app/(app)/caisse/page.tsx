import { ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { PosTerminal } from "@/components/caisse/PosTerminal";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPosProducts } from "@/lib/data/pos";
import { getCurrentStore } from "@/lib/data/store";

export default async function CaissePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const products = await getPosProducts(store.id);

  return (
    <>
      <PageHeader
        title="Caisse"
        description="Vente en personne : même catalogue et stock que votre boutique en ligne."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Vente impossible" description={searchParams.error} className="mb-6" />
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Aucun produit disponible"
          description="Ajoutez des produits actifs avec du stock pour pouvoir vendre en caisse."
        />
      ) : (
        <PosTerminal products={products} currency={store.currency} />
      )}
    </>
  );
}
