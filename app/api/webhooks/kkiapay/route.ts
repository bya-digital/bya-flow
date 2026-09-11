import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

interface ProviderConfigRow {
  config: Record<string, string>;
  current_payment_status: string;
}

interface KkiapayWebhookBody {
  transactionId?: string;
  partnerId?: string;
}

// Reçoit les notifications Kkiapay (order.created dispatché à part, voir
// lib/webhooks.ts — ceci est le webhook ENTRANT depuis Kkiapay, pas un
// webhook marchand sortant). L'en-tête x-kkiapay-secret sert de premier
// filtre, mais l'algorithme exact de signature de Kkiapay n'est pas
// documenté précisément : la confirmation réelle vient toujours de
// checkStatus() (appel serveur→Kkiapay), jamais du seul contenu de cette
// requête — même principe que la confirmation côté client
// (lib/actions/kkiapayCheckout.ts), qui peut arriver en double sans
// risque grâce à confirm_order_payment() (idempotente).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as KkiapayWebhookBody | null;
  const orderId = body?.partnerId;
  const transactionId = body?.transactionId;

  if (!orderId || !transactionId) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const supabase = createClient();

  // Anti-rejeu/anti-doublon (Phase 35B) : si Kkiapay a déjà livré ce
  // transactionId (retry réseau de leur côté, ou webhook rejoué), on ne
  // rappelle même pas checkStatus() — confirm_order_payment() était déjà
  // idempotente, mais refaisait un aller-retour API à chaque fois.
  const { data: isNewEvent } = await supabase.rpc("record_payment_webhook_event", {
    p_provider: "kkiapay",
    p_event_id: transactionId,
    p_order_id: orderId,
    p_payload: body,
  });
  if (isNewEvent === false) {
    return NextResponse.json({ ok: true });
  }

  const { data: providerRow } = await supabase
    .rpc("get_payment_provider_config", { p_order_id: orderId, p_provider: "kkiapay" })
    .maybeSingle<ProviderConfigRow>();

  if (!providerRow) {
    return NextResponse.json({ error: "Configuration introuvable." }, { status: 404 });
  }

  // Filtre non bloquant : si le format exact de cet en-tête (non
  // documenté précisément par Kkiapay) ne correspond pas à ce qui est
  // supposé ici, on continue quand même vers checkStatus() plutôt que de
  // rejeter — sinon une hypothèse de format inexacte casserait ce chemin
  // de confirmation en permanence sans qu'on puisse le corriger avant le
  // premier vrai test. La sécurité réelle reste checkStatus(), pas cet
  // en-tête : un appel forgé avec un mauvais transactionId n'obtient
  // jamais "SUCCESS" de Kkiapay.
  const headerSecret = request.headers.get("x-kkiapay-secret");
  if (headerSecret && headerSecret !== providerRow.config.secret) {
    console.warn("Webhook Kkiapay : en-tête x-kkiapay-secret inattendu, vérification via l'API quand même.");
  }

  if (providerRow.current_payment_status === "paid") {
    return NextResponse.json({ ok: true });
  }

  const provider = getPaymentProvider("kkiapay");
  const result = await provider.checkStatus(transactionId, providerRow.config);

  await supabase.rpc("confirm_order_payment", {
    p_order_id: orderId,
    p_provider: "kkiapay",
    p_provider_reference: transactionId,
    p_verified_amount: result.amount ?? null,
    p_verified_status: result.status === "succeeded" ? "succeeded" : "failed",
  });

  return NextResponse.json({ ok: true });
}
