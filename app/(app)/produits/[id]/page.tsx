import { notFound } from "next/navigation";
import { DeleteProductButton } from "@/components/produits/DeleteProductButton";
import { ProductForm } from "@/components/produits/ProductForm";
import { ProductImages } from "@/components/produits/ProductImages";
import { ProductVariants } from "@/components/produits/ProductVariants";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateProduct } from "@/lib/actions/products";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export default async function ProduitDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();

  const [{ data: product }, { data: categories }, { data: images }, { data: variants }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", params.id).maybeSingle(),
      supabase
        .from("product_categories")
        .select("id, name")
        .eq("store_id", store.id)
        .order("name", { ascending: true }),
      supabase
        .from("product_images")
        .select("id, url")
        .eq("product_id", params.id)
        .order("position", { ascending: true }),
      supabase
        .from("product_variants")
        .select("name, price, compare_at_price, sku, stock")
        .eq("product_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

  if (!product) notFound();

  return (
    <>
      <PageHeader title={product.name} description="Fiche produit." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Modifications enregistrées" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Informations générales</h2>
            </CardHeader>
            <CardContent>
              <ProductForm action={updateProduct} product={product} categories={categories ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Variantes</h2>
            </CardHeader>
            <CardContent>
              <ProductVariants productId={product.id} variants={variants ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Images</h2>
            </CardHeader>
            <CardContent>
              <ProductImages productId={product.id} images={images ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Zone dangereuse</h2>
            </CardHeader>
            <CardContent>
              <DeleteProductButton productId={product.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
