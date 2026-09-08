import type {
  PaymentConfig,
  PaymentInitiationResult,
  PaymentProvider,
  PaymentStatusResult,
} from "@/lib/payments/types";

// Détails d'API confirmés dans le SDK PHP officiel (github.com/kkiapay/php-sdk,
// src/Kkiapay.php + src/Constants.php) le 2026-09-08 — jamais inventés.
const BASE_URL = "https://api.kkiapay.me";
const SANDBOX_URL = "https://api-sandbox.kkiapay.me";

interface KkiapayVerifyResponse {
  status?: string;
  amount?: number;
  transactionId?: string;
  failureCode?: string;
  failureMessage?: string;
}

// Kkiapay fonctionne par widget déclenché côté client (voir
// components/checkout/KkiapayCheckout.tsx), pas par un flux serveur
// "créer une transaction → obtenir une URL de redirection" — initiate()
// n'est donc pas utilisée pour ce fournisseur ; checkStatus() en revanche
// correspond exactement à l'appel serveur de vérification de Kkiapay,
// seule source de vérité jamais utilisée pour marquer une commande payée
// (voir lib/actions/kkiapayCheckout.ts et app/api/webhooks/kkiapay).
export function createKkiapayProvider(): PaymentProvider {
  return {
    id: "kkiapay",
    name: "Kkiapay",
    fields: [
      { key: "public_key", label: "Clé publique" },
      { key: "private_key", label: "Clé privée" },
      { key: "secret", label: "Clé secrète" },
      { key: "sandbox", label: "Mode test (sandbox)", type: "checkbox" },
    ],
    isConfigured(config: PaymentConfig) {
      return Boolean(
        config.public_key?.trim() && config.private_key?.trim() && config.secret?.trim()
      );
    },
    async initiate(): Promise<PaymentInitiationResult> {
      return {
        status: "pending",
        errorMessage: "Kkiapay utilise le widget côté client, pas l'initiation serveur.",
      };
    },
    async checkStatus(
      transactionId: string,
      config: PaymentConfig
    ): Promise<PaymentStatusResult> {
      const baseUrl = config.sandbox === "true" ? SANDBOX_URL : BASE_URL;

      try {
        const response = await fetch(`${baseUrl}/api/v1/transactions/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-API-KEY": config.public_key,
            "X-PRIVATE-KEY": config.private_key,
            "X-SECRET-KEY": config.secret,
          },
          body: JSON.stringify({ transactionId }),
        });

        if (!response.ok) {
          return { status: "failed", providerReference: transactionId };
        }

        const data = (await response.json()) as KkiapayVerifyResponse;

        if (data.status === "SUCCESS") {
          return {
            status: "succeeded",
            providerReference: transactionId,
            amount: typeof data.amount === "number" ? data.amount : undefined,
          };
        }

        return { status: "failed", providerReference: transactionId };
      } catch {
        return { status: "failed", providerReference: transactionId };
      }
    },
  };
}
