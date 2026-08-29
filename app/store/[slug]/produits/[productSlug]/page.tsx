import { Package } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicProductBySlug, getPublicStoreBySlug } from "@/lib/data/publicStore";

export default async function StoreProductPage({
  params,
}: {
  params: { slug: string; productSlug: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const product = await getPublicProductBySlug(store.id, params.productSlug);
  if (!product) notFound();

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((url) => (
                <div key={url} className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-semibold text-slate-900">
              {currencyFormatter.format(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-base text-slate-400 line-through">
                {currencyFormatter.format(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm font-medium">
            {product.stock > 0 ? (
              <span className="text-emerald-600">En stock</span>
            ) : (
              <span className="text-red-600">Rupture de stock</span>
            )}
          </p>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          )}

          {product.variants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-900">Options disponibles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <span
                    key={variant.id}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
                  >
                    {variant.name}
                    {variant.stock <= 0 && (
                      <span className="ml-1 text-xs text-red-600">(rupture)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            L&apos;achat en ligne (panier &amp; paiement) arrive dans une prochaine étape.
            Contactez la boutique directement pour commander ce produit dès maintenant.
          </div>
        </div>
      </div>
    </div>
  );
}
