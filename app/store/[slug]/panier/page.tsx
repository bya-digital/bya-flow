import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { removeCartItem, updateCartItemQuantity } from "@/lib/actions/publicCart";
import { getPublicCart } from "@/lib/data/publicCart";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

export default async function StoreCartPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const cart = await getPublicCart(store.id);
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Votre panier</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      {cart.items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-20 text-center">
          <ShoppingCart className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-slate-500">Votre panier est vide.</p>
          <Link
            href={`/store/${store.slug}`}
            className="mt-4 text-sm font-medium text-brand-600 hover:underline"
          >
            Retourner à la boutique
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/store/${store.slug}/produits/${item.slug}`}
                    className="truncate text-sm font-medium text-slate-900 hover:text-brand-600"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {currencyFormatter.format(item.unitPrice)}
                  </p>
                </div>

                <form action={updateCartItemQuantity} className="flex items-center gap-2">
                  <input type="hidden" name="storeSlug" value={store.slug} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    max={item.stock}
                    defaultValue={item.quantity}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Modifier
                  </button>
                </form>

                <p className="w-24 shrink-0 text-right text-sm font-semibold text-slate-900">
                  {currencyFormatter.format(item.unitPrice * item.quantity)}
                </p>

                <form action={removeCartItem}>
                  <input type="hidden" name="storeSlug" value={store.slug} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button
                    type="submit"
                    aria-label="Retirer du panier"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </form>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
            <span className="text-base font-semibold text-slate-900">Sous-total</span>
            <span className="text-xl font-bold text-slate-900">
              {currencyFormatter.format(cart.subtotal)}
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Le paiement en ligne (validation de commande) arrive dans une prochaine étape.
            Contactez la boutique directement pour finaliser cette commande dès maintenant.
          </div>
        </>
      )}
    </div>
  );
}
