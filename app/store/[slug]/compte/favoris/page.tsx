import { Heart, Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WishlistButton } from "@/components/store/WishlistButton";
import { getCustomerSession } from "@/lib/data/customerAccount";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { getWishlistProducts } from "@/lib/data/wishlist";

export default async function StoreWishlistPage({ params }: { params: { slug: string } }) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const session = await getCustomerSession();
  if (!session.isLoggedIn) {
    redirect(`/store/${store.slug}/compte/connexion`);
  }

  const products = await getWishlistProducts(store.id);
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href={`/store/${store.slug}/compte`}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← Mon compte
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">Mes favoris</h1>

      {products.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <Heart className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-slate-500">Aucun favori pour l&apos;instant.</p>
          <Link
            href={`/store/${store.slug}`}
            className="mt-4 text-sm font-medium text-brand-600 hover:underline"
          >
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <div className="absolute right-2 top-2 z-10">
                <WishlistButton
                  storeId={store.id}
                  storeSlug={store.slug}
                  productId={product.id}
                  isActive
                  returnTo={`/store/${store.slug}/compte/favoris`}
                />
              </div>
              <Link href={`/store/${store.slug}/produits/${product.slug}`}>
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {currencyFormatter.format(product.price)}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
