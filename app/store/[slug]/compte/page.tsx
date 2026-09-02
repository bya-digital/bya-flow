import { Heart, Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyReferralLink } from "@/components/store/CopyReferralLink";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updateEmail, updatePassword } from "@/lib/actions/auth";
import { logoutCustomer } from "@/lib/actions/customerAuth";
import { getCustomerOrders, getCustomerSession } from "@/lib/data/customerAccount";
import { getCustomerLoyaltyBalance } from "@/lib/data/loyalty";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { getMyReferralCode } from "@/lib/data/referral";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export default async function StoreAccountPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; message?: string; success?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const session = await getCustomerSession();
  if (!session.isLoggedIn) {
    redirect(`/store/${store.slug}/compte/connexion`);
  }

  const orders = await getCustomerOrders(store.id);
  const loyaltyBalance = store.loyaltyEnabled
    ? await getCustomerLoyaltyBalance(store.id, session.email)
    : 0;
  const referralCode = store.referralEnabled
    ? await getMyReferralCode(store.id, session.email)
    : null;
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

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      {searchParams.message && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {searchParams.message}
        </p>
      )}
      {searchParams.success === "password" && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Mot de passe mis à jour.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href={`/store/${store.slug}/compte/favoris`}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
        >
          <Heart className="h-4 w-4" />
          Mes favoris
        </Link>
        {store.loyaltyEnabled && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            {loyaltyBalance} points de fidélité
          </span>
        )}
      </div>

      {referralCode && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-900">Parrainez vos proches</p>
          <p className="mt-1 text-xs text-slate-500">
            Partagez votre lien : vous et la personne parrainée gagnez des points à sa première
            commande.
          </p>
          <CopyReferralLink storeSlug={store.slug} code={referralCode} />
        </div>
      )}

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

      <div className="mt-10 grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Changer d&apos;email</h2>
          <form action={updateEmail} className="mt-3 space-y-3">
            <input type="hidden" name="redirect" value={`/store/${store.slug}/compte`} />
            <div>
              <label htmlFor="email" className={labelClasses}>
                Nouvelle adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={session.email ?? ""}
                className={inputClasses}
              />
            </div>
            <p className="text-xs text-slate-500">
              Un email de confirmation sera envoyé à la nouvelle adresse.
            </p>
            <SubmitButton pendingText="Envoi..." size="sm">
              Mettre à jour l&apos;email
            </SubmitButton>
          </form>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Changer de mot de passe</h2>
          <form action={updatePassword} className="mt-3 space-y-3">
            <input type="hidden" name="redirect" value={`/store/${store.slug}/compte`} />
            <input type="hidden" name="errorRedirect" value={`/store/${store.slug}/compte`} />
            <div>
              <label htmlFor="password" className={labelClasses}>
                Nouveau mot de passe
              </label>
              <PasswordInput id="password" name="password" required minLength={6} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClasses}>
                Confirmer le mot de passe
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={6}
                className={inputClasses}
              />
            </div>
            <SubmitButton pendingText="Mise à jour..." size="sm">
              Mettre à jour le mot de passe
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
