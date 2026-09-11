// Détails d'API confirmés sur la documentation officielle Resend
// (resend.com/docs/api-reference/emails/send-batch-emails) le
// 2026-09-10 — jamais inventés. Jusqu'à 100 emails par appel batch.
const BATCH_URL = "https://api.resend.com/emails/batch";
const BATCH_SIZE = 100;

export interface ResendEmailInput {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface ResendBatchResult {
  index: number;
  success: boolean;
  errorMessage?: string;
}

// Envoie par lots de 100 max — jamais un seul email groupé à tous les
// destinataires (chacun ne doit jamais voir l'adresse des autres).
export async function sendResendBatch(
  apiKey: string,
  emails: ResendEmailInput[]
): Promise<ResendBatchResult[]> {
  const results: ResendBatchResult[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(BATCH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        batch.forEach((_, j) =>
          results.push({ index: i + j, success: false, errorMessage: errorText })
        );
        continue;
      }

      const data = (await response.json()) as { data?: { id: string }[] };
      const sent = data.data ?? [];
      batch.forEach((_, j) => {
        const ok = Boolean(sent[j]?.id);
        results.push({
          index: i + j,
          success: ok,
          errorMessage: ok ? undefined : "Réponse Resend sans identifiant de message.",
        });
      });
    } catch (err) {
      batch.forEach((_, j) =>
        results.push({
          index: i + j,
          success: false,
          errorMessage: err instanceof Error ? err.message : "Erreur réseau.",
        })
      );
    }
  }

  return results;
}
