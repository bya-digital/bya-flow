import { Package } from "lucide-react";
import Link from "next/link";
import { getPublicProducts, getPublicStoreBySlug } from "@/lib/data/publicStore";

export default async function StoreHomePage({ params }: { params: { slug: string } }) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const products = await getPublicProducts(store.id);
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">{store.name}</h1>
        {store.description && (
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">{store.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-20 text-center">
          <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-slate-500">
            Cette boutique n&apos;a pas encore de produit en ligne.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/store/${store.slug}/produits/${product.slug}`}
              className="group"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600">
                  {product.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {currencyFormatter.format(product.price)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-xs text-slate-400 line-through">
                      {currencyFormatter.format(product.compareAtPrice)}
                    </span>
                  )}
                </div>
                {product.stock <= 0 && (
                  <p className="mt-1 text-xs font-medium text-red-600">Rupture de stock</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
