import { createHmac, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function signWebhookPayload(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

interface WebhookEndpointRow {
  url: string;
  secret: string;
}

// Envoi au mieux, sans file de relance (première tranche) : une commande
// se finalise même si aucune des URL enregistrées ne répond. Attendu
// (avec un délai plafonné par appel) plutôt que vraiment "fire and
// forget", car rien ne garantit qu'une requête non attendue survive à la
// fin de l'invocation de la fonction serverless après le redirect().
export async function dispatchOrderCreatedWebhooks(
  storeId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();
  const { data: webhooks } = await supabase.rpc("get_active_order_webhooks", {
    p_store_id: storeId,
  });

  const endpoints = (webhooks ?? []) as WebhookEndpointRow[];
  if (endpoints.length === 0) return;

  const body = JSON.stringify({ event: "order.created", data: payload });

  await Promise.allSettled(
    endpoints.map((endpoint) =>
      fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BYA-Signature": signWebhookPayload(endpoint.secret, body),
        },
        body,
        signal: AbortSignal.timeout(5000),
      })
    )
  );
}
