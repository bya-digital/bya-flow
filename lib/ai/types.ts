// Interface abstraite du fournisseur IA. Toute intégration future (OpenAI,
// Anthropic...) implémente ce contrat — le reste de l'application ne
// dépend jamais d'un fournisseur concret, seulement de cette interface.

export interface ProductDescriptionInput {
  name: string;
  category?: string | null;
  price?: number | null;
  currency?: string;
}

export interface CampaignContentInput {
  name: string;
  channel: string;
  goal?: string | null;
}

export interface CampaignContentOutput {
  subject: string;
  content: string;
}

// Données réelles de la boutique, jamais un chiffre inventé —
// l'assistant ne répond qu'à partir de ce contexte, jamais d'une
// connaissance générale qu'il n'a pas (voir heuristicProvider).
export interface ChatContext {
  storeName: string;
  currency: string;
  revenue30d: number;
  ordersCount30d: number;
  averageBasket30d: number;
  newCustomers30d: number;
  totalCustomers: number;
  topProduct: { name: string; unitsSold: number } | null;
  growthScore: number | null;
  vipCount: number;
  atRiskCount: number;
  // Permissions granulaires (Phase 50) : un membre sans le droit
  // "finances" ne doit jamais recevoir de chiffre d'affaires/panier
  // moyen via l'assistant, même si la donnée est techniquement dans
  // ce contexte — le refus se fait côté provider, jamais en amont en
  // omettant simplement le champ (le provider doit pouvoir le dire
  // explicitement plutôt que de sembler ne pas savoir).
  canViewFinances: boolean;
}

export interface AIProvider {
  generateProductDescription(input: ProductDescriptionInput): Promise<string>;
  generateCampaignContent(input: CampaignContentInput): Promise<CampaignContentOutput>;
  chat(message: string, context: ChatContext): Promise<string>;
}
