import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { getCustomerSession } from "@/lib/data/customerAccount";
import { getPublicOrder } from "@/lib/data/publicOrder";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  refunded: "Remboursé",
};

export default async function StoreAccountOrderPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const session = await getCustomerSession();
  if (!session.isLoggedIn) {
    redirect(`/store/${store.slug}/compte/connexion`);
  }

  const order = await getPublicOrder(params.id);
  if (!order) notFound();

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/store/${store.slug}/compte`}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← Mes commandes
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Commande #{order.orderNumber}</h1>
        <span className="text-sm text-slate-500">{dateFormatter.format(new Date(order.createdAt))}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <Badge tone="neutral">{STATUS_LABELS[order.status] ?? order.status}</Badge>
        <Badge tone={order.paymentStatus === "paid" ? "success" : "warning"}>
          Paiement : {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
        </Badge>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200">
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
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-slate-900">
              {currencyFormatter.format(order.total)}
            </span>
          </div>
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
    </div>
  );
}
