import { redirect } from "next/navigation";
import { submitCheckout } from "@/lib/actions/checkout";
import { getPublicCart } from "@/lib/data/publicCart";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export default async function StoreCheckoutPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const cart = await getPublicCart(store.id);
  if (cart.items.length === 0) {
    redirect(`/store/${store.slug}/panier`);
  }

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Finaliser la commande</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form action={submitCheckout} className="space-y-5 lg:col-span-2">
          <input type="hidden" name="storeSlug" value={store.slug} />
          <input type="hidden" name="cartId" value={cart.id ?? ""} />

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Coordonnées</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className={labelClasses}>
                  Nom complet
                </label>
                <input id="fullName" name="fullName" required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="email" className={labelClasses}>
                  Email
                </label>
                <input id="email" name="email" type="email" required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="phone" className={labelClasses}>
                  Téléphone
                </label>
                <input id="phone" name="phone" className={inputClasses} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Adresse de livraison</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className={labelClasses}>
                  Adresse
                </label>
                <input id="address" name="address" required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="city" className={labelClasses}>
                  Ville
                </label>
                <input id="city" name="city" required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="postalCode" className={labelClasses}>
                  Code postal
                </label>
                <input id="postalCode" name="postalCode" className={inputClasses} />
              </div>
              <div>
                <label htmlFor="country" className={labelClasses}>
                  Pays
                </label>
                <input id="country" name="country" required className={inputClasses} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className={labelClasses}>
              Notes (optionnel)
            </label>
            <textarea id="notes" name="notes" rows={3} className={inputClasses} />
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Le paiement en ligne arrive dans une prochaine étape. Votre commande sera
            enregistrée en attente de paiement — la boutique vous contactera pour les
            modalités de règlement.
          </div>

          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Confirmer la commande
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Récapitulatif</h2>
          <div className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium text-slate-900">
                  {currencyFormatter.format(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-slate-900">
              {currencyFormatter.format(cart.subtotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
