import type { AIProvider } from "@/lib/ai/types";

// Fournisseur par défaut : aucun appel externe, aucune clé API requise.
// Génère un texte correct à partir de modèles, pour rester utile dès
// aujourd'hui sans connecter un fournisseur IA payant sans nécessité
// (cahier des charges, section IA). Un vrai fournisseur (OpenAI,
// Anthropic...) pourra implémenter la même interface `AIProvider` et
// remplacer celui-ci sans changer le reste de l'application.

const CATEGORY_ADJECTIVES = ["soigné", "apprécié", "populaire", "de qualité"];

function pick<T>(items: T[], seed: string): T {
  const index = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % items.length;
  return items[index];
}

export const heuristicProvider: AIProvider = {
  async generateProductDescription({ name, category, price, currency }) {
    const adjective = pick(CATEGORY_ADJECTIVES, name || "produit");
    const categoryLine = category ? ` Idéal pour les amateurs de ${category.toLowerCase()}.` : "";
    const priceLine =
      price !== undefined && price !== null && price > 0
        ? ` À ${price.toFixed(2)} ${currency ?? "EUR"}, un excellent rapport qualité-prix.`
        : "";
    return `Découvrez ${name}, un produit ${adjective} qui répondra à vos attentes.${categoryLine}${priceLine} Disponible dès maintenant, ne passez pas à côté.`;
  },

  async generateCampaignContent({ name, channel, goal }) {
    const goalLine = goal ? ` pour ${goal}` : "";
    const channelLine =
      channel === "sms"
        ? "Message court pensé pour un envoi par SMS."
        : channel === "whatsapp"
          ? "Message convivial pensé pour un envoi par WhatsApp."
          : "Message pensé pour un envoi par email.";

    return {
      subject: `${name} : une offre à ne pas manquer`,
      content: `Bonjour,\n\nDécouvrez notre campagne "${name}"${goalLine}. C'est le moment idéal pour (re)découvrir nos produits et profiter de nos offres du moment.\n\n${channelLine}\n\nÀ très vite,\nL'équipe`,
    };
  },
};
