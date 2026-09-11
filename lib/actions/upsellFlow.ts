"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface NewOrderResult {
  id: string;
  store_id: string;
}

// accept_upsell_offer() (SECURITY DEFINER) revérifie elle-même l'offre
// et crée une vraie commande séparée, payment_status 'pending' — jamais
// un montant/produit fourni par le client, jamais un paiement contourné.
export async function acceptUpsellOffer(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const offerType = formData.get("offerType") as string;
  const storeSlug = formData.get("storeSlug") as string;

  const supabase = createClient();
  const { data: newOrder, error } = await supabase
    .rpc("accept_upsell_offer", { p_order_id: orderId, p_offer_type: offerType })
    .single<NewOrderResult>();

  if (error || !newOrder) {
    redirect(`/store/${storeSlug}/commande/${orderId}`);
    return;
  }

  // Même règle que le checkout normal : si un PSP est actif pour cette
  // boutique, cette nouvelle commande passe elle aussi par un vrai
  // paiement avant confirmation.
  const { data: activeProvider } = await supabase
    .from("payment_providers")
    .select("provider")
    .eq("store_id", newOrder.store_id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle<{ provider: string }>();

  if (activeProvider) {
    redirect(`/store/${storeSlug}/commande/${newOrder.id}/payer`);
  }

  redirect(`/store/${storeSlug}/commande/${newOrder.id}`);
}

export async function declineUpsellOffer(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const storeSlug = formData.get("storeSlug") as string;

  const supabase = createClient();
  await supabase.rpc("decline_upsell_offer", { p_order_id: orderId });

  redirect(`/store/${storeSlug}/commande/${orderId}`);
}
