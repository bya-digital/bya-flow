import type {
  PaymentConfig,
  PaymentInitiationResult,
  PaymentProvider,
  PaymentProviderField,
  PaymentProviderId,
  PaymentStatusResult,
} from "@/lib/payments/types";

// Fabrique un fournisseur "prêt à brancher" : la configuration
// (isConfigured) et le formulaire (fields) fonctionnent réellement, mais
// initiate()/checkStatus() ne parlent encore à aucune vraie API — c'est
// exactement le terrain préparé demandé, pas un paiement simulé comme
// s'il était réel. Chaque fournisseur pourra plus tard remplacer son
// entrée dans lib/payments/index.ts par une vraie implémentation, sans
// changer le reste de l'application.
export function createStubProvider(
  id: PaymentProviderId,
  name: string,
  fields: PaymentProviderField[]
): PaymentProvider {
  return {
    id,
    name,
    fields,
    isConfigured(config: PaymentConfig) {
      return fields.every((field) => Boolean(config[field.key]?.trim()));
    },
    async initiate(): Promise<PaymentInitiationResult> {
      return {
        status: "failed",
        errorMessage: `${name} n'est pas encore connecté à une vraie API de paiement — architecture prête, intégration à venir.`,
      };
    },
    async checkStatus(): Promise<PaymentStatusResult> {
      return { status: "pending" };
    },
  };
}
