import { notFound, redirect } from "next/navigation";
import { KkiapayCheckout } from "@/components/checkout/KkiapayCheckout";
import { getPublicOrder } from "@/lib/data/publicOrder";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { createClient } from "@/lib/supabase/server";

interface KkiapayPublicConfig {
  public_key: string;
  sandbox: string;
}

export default async function StorePaymentPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const order = await getPublicOrder(params.orderId);
  if (!order) notFound();

  // Déjà payée (webhook plus rapide que le retour du widget, ou page
  // rechargée) : rien à faire ici, direction la confirmation.
  if (order.paymentStatus === "paid") {
    redirect(`/store/${store.slug}/commande/${order.id}`);
  }

  const supabase = createClient();
  const { data: providerRow } = await supabase
    .from("payment_providers")
    .select("config")
    .eq("store_id", store.id)
    .eq("provider", "kkiapay")
    .eq("is_active", true)
    .maybeSingle<{ config: KkiapayPublicConfig }>();

  // Le fournisseur a été désactivé entre la création de la commande et
  // l'arrivée sur cette page : pas de paiement à proposer, retour à la
  // confirmation habituelle (reste en attente).
  if (!providerRow) {
    redirect(`/store/${store.slug}/commande/${order.id}`);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Paiement</h1>
      <p className="mt-2 text-sm text-slate-500">
        Commande n° {order.orderNumber} — {order.total.toFixed(2)} {store.currency}
      </p>

      <KkiapayCheckout
        orderId={order.id}
        storeSlug={store.slug}
        amount={order.total}
        publicKey={providerRow.config.public_key}
        sandbox={providerRow.config.sandbox === "true"}
      />
    </div>
  );
}
