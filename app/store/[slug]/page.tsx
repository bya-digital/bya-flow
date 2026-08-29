import { Package } from "lucide-react";
import Link from "next/link";
import { WishlistButton } from "@/components/store/WishlistButton";
import {
  getPublicFaqs,
  getPublicProducts,
  getPublicStoreBySlug,
  getPublicTestimonials,
} from "@/lib/data/publicStore";
import { getWishlistProductIds } from "@/lib/data/wishlist";

export default async function StoreHomePage({ params }: { params: { slug: string } }) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const [products, testimonials, faqs, wishlistIds] = await Promise.all([
    getPublicProducts(store.id),
    getPublicTestimonials(store.id),
    getPublicFaqs(store.id),
    getWishlistProductIds(store.id),
  ]);
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div>
      {store.heroTitle && (
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 lg:grid-cols-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {store.heroTitle}
              </h1>
              {store.heroSubtitle && (
                <p className="mt-4 max-w-lg text-lg text-slate-600">{store.heroSubtitle}</p>
              )}
              {store.heroCtaLabel && (
                <a
                  href="#catalogue"
                  className="mt-6 inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: "var(--store-accent)" }}
                >
                  {store.heroCtaLabel}
                </a>
              )}
            </div>
            {store.heroImageUrl && (
              <div className="aspect-video overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.heroImageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      <div id="catalogue" className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{store.name}</h2>
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
            <div key={product.id} className="group relative">
              <div className="absolute right-2 top-2 z-10">
                <WishlistButton
                  storeId={store.id}
                  storeSlug={store.slug}
                  productId={product.id}
                  isActive={wishlistIds.has(product.id)}
                  returnTo={`/store/${store.slug}`}
                />
              </div>
              <Link href={`/store/${store.slug}/produits/${product.slug}`}>
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
            </div>
          ))}
        </div>
        )}
      </div>

      {testimonials.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Ce que disent nos clients
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-600">&laquo;&nbsp;{testimonial.quote}&nbsp;&raquo;</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {testimonial.authorName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {faqs.length > 0 && (
        <div className="border-t border-slate-200 py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Questions fréquentes
            </h2>
            <div className="mt-8 space-y-6">
              {faqs.map((faq) => (
                <div key={faq.id}>
                  <p className="font-semibold text-slate-900">{faq.question}</p>
                  <p className="mt-1 text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
