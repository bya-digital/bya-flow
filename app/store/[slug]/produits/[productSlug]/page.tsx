import { Package } from "lucide-react";
import { notFound } from "next/navigation";
import { addToCart } from "@/lib/actions/publicCart";
import { getPublicProductBySlug, getPublicStoreBySlug } from "@/lib/data/publicStore";

export default async function StoreProductPage({
  params,
  searchParams,
}: {
  params: { slug: string; productSlug: string };
  searchParams: { error?: string };
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

          {searchParams.error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {searchParams.error}
            </p>
          )}

          {product.stock > 0 ? (
            <form action={addToCart} className="mt-6 flex items-end gap-3">
              <input type="hidden" name="storeId" value={store.id} />
              <input type="hidden" name="storeSlug" value={store.slug} />
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="productSlug" value={product.slug} />
              <div>
                <label htmlFor="quantity" className="block text-xs font-medium text-slate-500">
                  Quantité
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={product.stock}
                  defaultValue={1}
                  className="mt-1 w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Ajouter au panier
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Ce produit est actuellement en rupture de stock.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
