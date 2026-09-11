import { notFound } from "next/navigation";
import { CourseBuilder, type CourseModule } from "@/components/produits/CourseBuilder";
import { DeleteProductButton } from "@/components/produits/DeleteProductButton";
import { DigitalFileUpload } from "@/components/produits/DigitalFileUpload";
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
  searchParams: { error?: string; success?: string; message?: string };
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

  let downloadCount = 0;
  if (product.product_type === "digital") {
    const { data: orderItemRows } = await supabase
      .from("order_items")
      .select("id")
      .eq("product_id", product.id);
    const orderItemIds = (orderItemRows ?? []).map((row) => row.id as string);
    if (orderItemIds.length > 0) {
      const { count } = await supabase
        .from("product_downloads")
        .select("id", { count: "exact", head: true })
        .in("order_item_id", orderItemIds);
      downloadCount = count ?? 0;
    }
  }

  let courseModules: CourseModule[] = [];
  if (product.product_type === "course") {
    const { data: modulesData } = await supabase
      .from("course_modules")
      .select("id, title, course_lessons(id, title, video_url, content, file_name)")
      .eq("product_id", product.id)
      .order("position", { ascending: true })
      .order("position", { ascending: true, foreignTable: "course_lessons" });
    courseModules = (modulesData ?? []).map((mod) => ({
      id: mod.id,
      title: mod.title,
      lessons: (
        (mod.course_lessons as unknown as CourseModule["lessons"] | null) ?? []
      ).slice(),
    }));
  }

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
      {searchParams.message && (
        <div className="mb-4">
          <Alert tone="info" title="Information" description={searchParams.message} />
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

          {product.product_type === "physical" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Variantes</h2>
              </CardHeader>
              <CardContent>
                <ProductVariants productId={product.id} variants={variants ?? []} />
              </CardContent>
            </Card>
          )}

          {product.product_type === "course" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Modules et leçons</h2>
              </CardHeader>
              <CardContent>
                <CourseBuilder productId={product.id} modules={courseModules} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {product.product_type === "digital" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Fichier numérique</h2>
                  <span className="text-xs text-slate-400">
                    {downloadCount} téléchargement{downloadCount > 1 ? "s" : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <DigitalFileUpload
                  productId={product.id}
                  fileName={product.digital_file_name}
                  fileSize={product.digital_file_size}
                />
              </CardContent>
            </Card>
          )}

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
