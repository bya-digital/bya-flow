import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrder } from "@/lib/data/publicOrder";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

export default async function StoreOrderConfirmationPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const order = await getPublicOrder(params.orderId);
  if (!order) notFound();

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
              <span className="text-slate-600">
                {item.productName} × {item.quantity}
              </span>
              <span className="font-medium text-slate-900">
                {currencyFormatter.format(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <span className="text-sm font-semibold text-slate-900">Total</span>
          <span className="text-lg font-bold text-slate-900">
            {currencyFormatter.format(order.total)}
          </span>
        </div>
      </div>

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
