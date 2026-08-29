import { Heart, Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutCustomer } from "@/lib/actions/customerAuth";
import { getCustomerOrders, getCustomerSession } from "@/lib/data/customerAccount";
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

export default async function StoreAccountPage({ params }: { params: { slug: string } }) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const session = await getCustomerSession();
  if (!session.isLoggedIn) {
    redirect(`/store/${store.slug}/compte/connexion`);
  }

  const orders = await getCustomerOrders(store.id);
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
  });
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const firstName = session.fullName?.split(" ")[0] ?? session.email;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Bonjour {firstName}</h1>
        <form action={logoutCustomer}>
          <input type="hidden" name="storeSlug" value={store.slug} />
          <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Se déconnecter
          </button>
        </form>
      </div>

      <Link
        href={`/store/${store.slug}/compte/favoris`}
        className="mt-6 flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
      >
        <Heart className="h-4 w-4" />
        Mes favoris
      </Link>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Mes commandes</h2>

      {orders.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-slate-500">Aucune commande pour l&apos;instant.</p>
          <Link
            href={`/store/${store.slug}`}
            className="mt-4 text-sm font-medium text-brand-600 hover:underline"
          >
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/store/${store.slug}/compte/commandes/${order.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {dateFormatter.format(new Date(order.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {currencyFormatter.format(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
