// Endpoint/auth/paramètres confirmés sur la documentation officielle
// Twilio (twilio.com/docs/sms/api/message-resource et
// twilio.com/docs/whatsapp/api) le 2026-09-11 — jamais devinés. Même
// endpoint Messages.json pour SMS et WhatsApp, seul le préfixe
// "whatsapp:" sur From/To distingue les deux canaux.
const CONCURRENCY = 10;

export interface TwilioMessageInput {
  to: string;
  body: string;
}

export interface TwilioSendResult {
  index: number;
  success: boolean;
  errorMessage?: string;
}

function messagesUrl(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
}

async function sendOne(
  accountSid: string,
  authToken: string,
  from: string,
  message: TwilioMessageInput
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const body = new URLSearchParams({ From: from, To: message.to, Body: message.body });
    const response = await fetch(messagesUrl(accountSid), {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return {
        success: false,
        errorMessage:
          (data && typeof data === "object" && "message" in data
            ? String((data as { message: unknown }).message)
            : null) ?? response.statusText,
      };
    }

    return { success: true };
  } catch (err) {
    return { success: false, errorMessage: err instanceof Error ? err.message : "Erreur réseau." };
  }
}

// Twilio n'a pas d'API batch (contrairement à Resend) — un appel HTTP
// par message, en lots limités en concurrence pour ne pas déclencher
// de rate limiting côté Twilio.
export async function sendTwilioMessages(
  accountSid: string,
  authToken: string,
  from: string,
  messages: TwilioMessageInput[]
): Promise<TwilioSendResult[]> {
  const results: TwilioSendResult[] = new Array(messages.length);

  for (let i = 0; i < messages.length; i += CONCURRENCY) {
    const batch = messages.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((message) => sendOne(accountSid, authToken, from, message))
    );
    batchResults.forEach((result, j) => {
      results[i + j] = { index: i + j, ...result };
    });
  }

  return results;
}

export function toWhatsappAddress(phone: string): string {
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
}
