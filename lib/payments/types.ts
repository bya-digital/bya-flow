// Interface abstraite du fournisseur de paiement. Toute intégration
// future (Orange Money, Wave, MTN Money...) implémente ce contrat — le
// reste de l'application (checkout, commandes) ne dépend jamais d'un
// fournisseur concret, seulement de cette interface. Même principe que
// lib/ai/types.ts pour la couche IA.

export type PaymentProviderId =
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "moov_money"
  | "chariow"
  | "maketou"
  | "ikeepay"
  | "kkiapay";

export interface PaymentProviderField {
  key: string;
  label: string;
  // "secret" (défaut) : jamais renvoyé au navigateur une fois enregistré,
  // un champ vide au ré-enregistrement conserve la valeur existante.
  // "checkbox" : réglage non sensible (ex. mode test) — toujours
  // explicitement true/false à chaque enregistrement, jamais "conservé".
  type?: "secret" | "checkbox";
}

export interface PaymentConfig {
  [key: string]: string;
}

export interface PaymentInitiationInput {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerPhone?: string | null;
  returnUrl: string;
}

export interface PaymentInitiationResult {
  status: "redirect" | "pending" | "failed";
  redirectUrl?: string;
  providerReference?: string;
  errorMessage?: string;
}

export interface PaymentStatusResult {
  status: "pending" | "succeeded" | "failed" | "cancelled";
  providerReference?: string;
  // Montant confirmé par le fournisseur (jamais celui envoyé par le
  // client) — permet de vérifier qu'il couvre bien le total de la
  // commande avant de la marquer payée.
  amount?: number;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  name: string;
  // Champs de configuration nécessaires (clés API...) — génériques pour
  // l'instant, à ajuster une fois la documentation officielle de chaque
  // fournisseur consultée au moment de l'intégration réelle.
  fields: PaymentProviderField[];
  isConfigured(config: PaymentConfig): boolean;
  initiate(input: PaymentInitiationInput, config: PaymentConfig): Promise<PaymentInitiationResult>;
  checkStatus(providerReference: string, config: PaymentConfig): Promise<PaymentStatusResult>;
}
