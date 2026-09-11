import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DigitalDownloadButton } from "@/components/checkout/DigitalDownloadButton";
import { getPublicOrder } from "@/lib/data/publicOrder";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { createClient } from "@/lib/supabase/server";

export default async function StoreOrderConfirmationPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const order = await getPublicOrder(params.orderId);
  if (!order) notFound();

  // Offre upsell/downsell (Phase 42) jamais encore résolue pour cette
  // commande — toujours proposée avant la confirmation finale, jamais
  // après (directive Section 16 : reste entre CHECKOUT et THANK YOU).
  const { data: offer } = await createClient()
    .rpc("get_upsell_offer_for_order", { p_order_id: params.orderId })
    .maybeSingle<{ offer_id: string | null }>();
  if (offer?.offer_id) {
    redirect(`/store/${params.slug}/commande/${params.orderId}/upsell`);
  }

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Commande enregistrée</h1>
        <p className="mt-2 text-sm text-slate-500">
          Commande n° {order.orderNumber} — {store.name} vous contactera pour les modalités
          de paiement et de livraison.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200">
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <span className="text-slate-600">
                  {item.productName} × {item.quantity}
                </span>
                {item.productType === "digital" &&
                  (order.paymentStatus === "paid" ? (
                    <DigitalDownloadButton orderItemId={item.id} />
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      Téléchargement disponible après paiement.
                    </p>
                  ))}
                {item.productType === "course" &&
                  (order.paymentStatus === "paid" ? (
                    <Link
                      href={`/store/${store.slug}/compte/connexion?redirect=${encodeURIComponent(
                        `/store/${store.slug}/compte/formations/${item.productId}`
                      )}`}
                      className="mt-1 block text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Connectez-vous pour accéder à la formation
                    </Link>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      Accès à la formation disponible après paiement.
                    </p>
                  ))}
              </div>
              <span className="font-medium text-slate-900">
                {currencyFormatter.format(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t border-slate-200 p-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Sous-total</span>
            <span>{currencyFormatter.format(order.subtotal)}</span>
          </div>
          {order.shippingMethodName && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Livraison ({order.shippingMethodName})</span>
              <span>
                {order.shippingCost === 0 ? "Gratuite" : currencyFormatter.format(order.shippingCost)}
              </span>
            </div>
          )}
          {order.loyaltyPointsRedeemed > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span>Points utilisés ({order.loyaltyPointsRedeemed})</span>
              <span>-{currencyFormatter.format(order.loyaltyDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-slate-900">
              {currencyFormatter.format(order.total)}
            </span>
          </div>
        </div>
      </div>

      {order.loyaltyPointsEarned > 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Vous avez gagné <strong>{order.loyaltyPointsEarned} points</strong> de fidélité avec
          cette commande.
        </p>
      )}

      {order.shippingAddress && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Adresse de livraison</p>
          <p className="mt-1">{order.shippingAddress.name}</p>
          <p>{order.shippingAddress.address}</p>
          <p>
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href={`/store/${store.slug}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Retourner à la boutique
        </Link>
      </div>
    </div>
  );
}
