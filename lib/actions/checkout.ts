"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dispatchOrderCreatedWebhooks } from "@/lib/webhooks";

interface CheckoutOrderResult {
  id: string;
  store_id: string;
  order_number: number;
  total: number;
  subtotal: number;
  status: string;
  payment_status: string;
}

export async function submitCheckout(formData: FormData) {
  const storeSlug = formData.get("storeSlug") as string;
  const cartId = formData.get("cartId") as string;
  const shippingMethodId = (formData.get("shippingMethodId") as string) || null;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const notes = (formData.get("notes") as string) || null;
  const redeemPoints = Math.max(Number(formData.get("redeemPoints") || 0), 0);
  const checkoutUrl = `/store/${storeSlug}/checkout`;

  const shipping = {
    name: fullName,
    address: (formData.get("address") as string) || "",
    city: (formData.get("city") as string) || "",
    postalCode: (formData.get("postalCode") as string) || "",
    country: (formData.get("country") as string) || "",
  };

  const supabase = createClient();
  const { data: order, error } = await supabase
    .rpc("checkout_cart", {
      p_cart_id: cartId,
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_shipping: shipping,
      p_notes: notes,
      p_shipping_method_id: shippingMethodId,
      p_redeem_points: redeemPoints,
    })
    .single<CheckoutOrderResult>();

  if (error || !order) {
    redirect(
      `${checkoutUrl}?error=${encodeURIComponent(
        error?.message ?? "Impossible de finaliser la commande."
      )}`
    );
    return;
  }

  await dispatchOrderCreatedWebhooks(order.store_id, {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    subtotal: order.subtotal,
    total: order.total,
  });

  // Si un fournisseur de paiement quelconque est actif pour cette
  // boutique, le client passe par le paiement avant la confirmation —
  // sinon (aucun fournisseur branché), comportement inchangé : commande
  // enregistrée en attente. Jamais un fournisseur en particulier vérifié
  // ici : /payer décide seul comment le présenter (Phase 35B).
  const { data: activeProvider } = await supabase
    .from("payment_providers")
    .select("provider")
    .eq("store_id", order.store_id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle<{ provider: string }>();

  if (activeProvider) {
    redirect(`/store/${storeSlug}/commande/${order.id}/payer`);
  }

  redirect(`/store/${storeSlug}/commande/${order.id}`);
}
