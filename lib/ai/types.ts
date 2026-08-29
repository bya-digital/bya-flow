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

export interface AIProvider {
  generateProductDescription(input: ProductDescriptionInput): Promise<string>;
  generateCampaignContent(input: CampaignContentInput): Promise<CampaignContentOutput>;
}
