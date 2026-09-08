"use server";

import { getPaymentProvider } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

interface ProviderConfigRow {
  config: Record<string, string>;
  expected_amount: number;
  expected_currency: string;
  current_payment_status: string;
}

export interface ConfirmKkiapayResult {
  success: boolean;
  error?: string;
}

// Appelée directement depuis le composant client après le succès annoncé
// par le widget Kkiapay — jamais fait confiance à cette seule annonce
// côté navigateur : revérifie toujours la transaction auprès de Kkiapay
// elle-même avant de marquer quoi que ce soit payé. Le webhook
// (app/api/webhooks/kkiapay) fait exactement la même vérification en
// parallèle, au cas où le navigateur se ferme avant cet appel.
export async function confirmKkiapayPayment(
  orderId: string,
  transactionId: string
): Promise<ConfirmKkiapayResult> {
  if (!orderId || !transactionId) {
    return { success: false, error: "Paramètres de confirmation invalides." };
  }

  const supabase = createClient();

  const { data: providerRow } = await supabase
    .rpc("get_payment_provider_config", { p_order_id: orderId, p_provider: "kkiapay" })
    .maybeSingle<ProviderConfigRow>();

  if (!providerRow) {
    return { success: false, error: "Aucun paiement Kkiapay actif pour cette commande." };
  }

  if (providerRow.current_payment_status === "paid") {
    return { success: true };
  }

  const provider = getPaymentProvider("kkiapay");
  const result = await provider.checkStatus(transactionId, providerRow.config);

  const { error } = await supabase.rpc("confirm_order_payment", {
    p_order_id: orderId,
    p_provider: "kkiapay",
    p_provider_reference: transactionId,
    p_verified_amount: result.amount ?? null,
    p_verified_status: result.status === "succeeded" ? "succeeded" : "failed",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (result.status !== "succeeded") {
    return { success: false, error: "Le paiement n'a pas pu être confirmé." };
  }

  return { success: true };
}
