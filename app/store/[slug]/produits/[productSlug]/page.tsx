import { Package } from "lucide-react";
import { notFound } from "next/navigation";
import { StarRating } from "@/components/store/StarRating";
import { WishlistButton } from "@/components/store/WishlistButton";
import { addToCart } from "@/lib/actions/publicCart";
import { submitReview } from "@/lib/actions/reviews";
import { getCustomerSession } from "@/lib/data/customerAccount";
import { getMyReviewEligibility, getPublicReviews } from "@/lib/data/publicReviews";
import { getPublicProductBySlug, getPublicStoreBySlug } from "@/lib/data/publicStore";
import { getWishlistProductIds } from "@/lib/data/wishlist";

export default async function StoreProductPage({
  params,
  searchParams,
}: {
  params: { slug: string; productSlug: string };
  searchParams: { error?: string; reviewSuccess?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const product = await getPublicProductBySlug(store.id, params.productSlug);
  if (!product) notFound();

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  const [session, wishlistIds, reviewSummary] = await Promise.all([
    getCustomerSession(),
    getWishlistProductIds(store.id),
    getPublicReviews(product.id),
  ]);
  const eligibility = await getMyReviewEligibility(product.id, session.email);
  const productUrl = `/store/${store.slug}/produits/${product.slug}`;

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
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
            <WishlistButton
              storeId={store.id}
              storeSlug={store.slug}
              productId={product.id}
              isActive={wishlistIds.has(product.id)}
              returnTo={productUrl}
              className="shrink-0"
            />
          </div>

          {reviewSummary.count > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={reviewSummary.average} />
              <span className="text-sm text-slate-500">
                {reviewSummary.average.toFixed(1)} ({reviewSummary.count} avis)
              </span>
            </div>
          )}

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
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: "var(--store-accent)" }}
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

      <div className="mt-16 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900">Avis clients</h2>

        {searchParams.reviewSuccess && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Merci, votre avis a été enregistré.
          </p>
        )}

        {eligibility.hasPurchased && (
          <form action={submitReview} className="mt-4 rounded-xl border border-slate-200 p-4">
            <input type="hidden" name="storeSlug" value={store.slug} />
            <input type="hidden" name="productSlug" value={product.slug} />
            <input type="hidden" name="productId" value={product.id} />
            <p className="text-sm font-medium text-slate-900">
              {eligibility.existingReview ? "Modifier mon avis" : "Laisser un avis"}
            </p>
            <div className="mt-2">
              <label htmlFor="rating" className="block text-xs font-medium text-slate-500">
                Note
              </label>
              <select
                id="rating"
                name="rating"
                defaultValue={eligibility.existingReview?.rating ?? 5}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <label htmlFor="comment" className="block text-xs font-medium text-slate-500">
                Commentaire (optionnel)
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={2}
                defaultValue={eligibility.existingReview?.comment ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <button
              type="submit"
              className="mt-3 rounded-lg px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: "var(--store-accent)" }}
            >
              {eligibility.existingReview ? "Mettre à jour" : "Publier mon avis"}
            </button>
          </form>
        )}

        {reviewSummary.reviews.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aucun avis pour l&apos;instant.</p>
        ) : (
          <div className="mt-6 space-y-6">
            {reviewSummary.reviews.map((review) => (
              <div key={review.id} className="border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} size={14} />
                  <span className="text-sm font-medium text-slate-900">{review.customerName}</span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                )}
                {review.merchantReply && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Réponse de {store.name}
                    </p>
                    <p className="mt-1">{review.merchantReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
