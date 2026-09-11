import { notFound, redirect } from "next/navigation";
import { KkiapayCheckout } from "@/components/checkout/KkiapayCheckout";
import { Alert } from "@/components/ui/Alert";
import { getPaymentProvider } from "@/lib/payments";
import type { PaymentProviderId } from "@/lib/payments/types";
import { getPublicOrder } from "@/lib/data/publicOrder";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { createClient } from "@/lib/supabase/server";

interface ActiveProviderRow {
  provider: PaymentProviderId;
  config: Record<string, string>;
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
  // Générique depuis Phase 35B : n'importe quel fournisseur actif pour
  // la boutique, jamais un id en particulier vérifié ici — la manière de
  // présenter le paiement dépend de son checkoutMode ci-dessous.
  const { data: providerRow } = await supabase
    .from("payment_providers")
    .select("provider, config")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle<ActiveProviderRow>();

  // Le fournisseur a été désactivé entre la création de la commande et
  // l'arrivée sur cette page : pas de paiement à proposer, retour à la
  // confirmation habituelle (reste en attente).
  if (!providerRow) {
    redirect(`/store/${store.slug}/commande/${order.id}`);
  }

  const provider = getPaymentProvider(providerRow.provider);

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Paiement</h1>
      <p className="mt-2 text-sm text-slate-500">
        Commande n° {order.orderNumber} — {order.total.toFixed(2)} {store.currency}
      </p>

      {provider.checkoutMode === "widget" && providerRow.provider === "kkiapay" ? (
        <KkiapayCheckout
          orderId={order.id}
          storeSlug={store.slug}
          amount={order.total}
          publicKey={providerRow.config.public_key}
          sandbox={providerRow.config.sandbox === "true"}
        />
      ) : (
        // Aucun autre fournisseur n'a encore de vrai parcours de paiement
        // câblé ici (Phase 35B a préparé l'abstraction, pas une intégration
        // production supplémentaire — voir directive du 2026-09-10) :
        // jamais prétendre qu'un paiement est possible s'il ne l'est pas.
        <Alert
          className="mt-8 text-left"
          tone="warning"
          title={`${provider.name} n'est pas encore réellement connecté`}
          description="Contactez la boutique pour finaliser votre commande autrement."
        />
      )}
    </div>
  );
}
