import { createStubProvider } from "@/lib/payments/providers/stubProvider";
import type { PaymentProvider, PaymentProviderId } from "@/lib/payments/types";

// Registre des fournisseurs de paiement pris en charge. Pour connecter un
// vrai fournisseur : remplacer son entrée par une classe qui implémente
// PaymentProvider (voir lib/ai/index.ts pour le même principe côté IA).
// Les champs de configuration listés ici sont génériques (clé publique /
// privée / secrète) — à vérifier contre la documentation officielle de
// chaque fournisseur au moment de l'intégration réelle, jamais inventés
// comme s'ils étaient exacts.
export const paymentProviders: Record<PaymentProviderId, PaymentProvider> = {
  orange_money: createStubProvider("orange_money", "Orange Money", [
    { key: "merchant_key", label: "Clé marchand" },
    { key: "api_secret", label: "Clé API secrète" },
  ]),
  wave: createStubProvider("wave", "Wave", [{ key: "api_key", label: "Clé API" }]),
  mtn_money: createStubProvider("mtn_money", "MTN Mobile Money", [
    { key: "subscription_key", label: "Clé d'abonnement" },
    { key: "api_user", label: "Identifiant API" },
    { key: "api_key", label: "Clé API" },
  ]),
  moov_money: createStubProvider("moov_money", "Moov Money", [
    { key: "merchant_id", label: "Identifiant marchand" },
    { key: "api_key", label: "Clé API" },
  ]),
  chariow: createStubProvider("chariow", "Chariow", [{ key: "api_key", label: "Clé API" }]),
  maketou: createStubProvider("maketou", "Maketou", [{ key: "api_key", label: "Clé API" }]),
  ikeepay: createStubProvider("ikeepay", "iKeepay", [
    { key: "public_key", label: "Clé publique" },
    { key: "private_key", label: "Clé privée" },
  ]),
  kkiapay: createStubProvider("kkiapay", "Kkiapay", [
    { key: "public_key", label: "Clé publique" },
    { key: "private_key", label: "Clé privée" },
    { key: "secret", label: "Clé secrète" },
  ]),
};

export function getPaymentProvider(id: PaymentProviderId): PaymentProvider {
  return paymentProviders[id];
}

export function listPaymentProviders(): PaymentProvider[] {
  return Object.values(paymentProviders);
}

export type {
  PaymentConfig,
  PaymentInitiationInput,
  PaymentInitiationResult,
  PaymentProvider,
  PaymentProviderField,
  PaymentProviderId,
  PaymentStatusResult,
} from "@/lib/payments/types";
