import { ProductForm } from "@/components/produits/ProductForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createProduct } from "@/lib/actions/products";
import { createClient } from "@/lib/supabase/server";

export default async function NouveauProduitPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();

  let categories: { id: string; name: string }[] = [];
  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("product_categories")
      .select("id, name")
      .eq("store_id", store.id)
      .order("name", { ascending: true });
    categories = data ?? [];
  }

  return (
    <>
      <PageHeader title="Nouveau produit" description="Ajoutez un produit à votre catalogue." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <ProductForm action={createProduct} categories={categories} />
        </CardContent>
      </Card>
    </>
  );
}
