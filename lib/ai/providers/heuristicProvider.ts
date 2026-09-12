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

  // Assistant conversationnel (directive Section 23) : répond
  // uniquement à partir des vraies données de la boutique (ChatContext),
  // jamais d'une connaissance générale inventée — reconnaît un petit
  // ensemble de questions courantes par mots-clés, et le dit
  // honnêtement quand une question ne correspond à aucune d'elles,
  // plutôt que d'improviser une réponse plausible mais fausse.
  async chat(message, context) {
    const q = message.toLowerCase();
    const money = (value: number) =>
      new Intl.NumberFormat("fr-FR", { style: "currency", currency: context.currency }).format(
        value
      );

    if (/(chiffre d'affaires|ca\b|revenu|vente)/.test(q)) {
      return `Sur les 30 derniers jours, ${context.storeName} a réalisé ${money(context.revenue30d)} de chiffre d'affaires, sur ${context.ordersCount30d} commande(s) (panier moyen ${money(context.averageBasket30d)}).`;
    }
    if (/(commande)/.test(q)) {
      return `Vous avez reçu ${context.ordersCount30d} commande(s) sur les 30 derniers jours, pour un panier moyen de ${money(context.averageBasket30d)}.`;
    }
    if (/(produit vendu|meilleur produit|top produit|plus vendu)/.test(q)) {
      return context.topProduct
        ? `Votre produit le plus vendu sur les 30 derniers jours est "${context.topProduct.name}" (${context.topProduct.unitsSold} unité(s)).`
        : "Aucune vente enregistrée sur les 30 derniers jours pour identifier un produit phare.";
    }
    if (/(client vip|vip)/.test(q)) {
      return `Vous avez actuellement ${context.vipCount} client(s) VIP (segment RFM) sur ${context.totalCustomers} client(s) au total.`;
    }
    if (/(risque|inactif|perdre)/.test(q)) {
      return `${context.atRiskCount} client(s) sont actuellement classés "à risque" (moins actifs qu'avant) — une campagne ciblée sur ce segment peut aider à les relancer.`;
    }
    if (/(nouveau client|nouveaux clients)/.test(q)) {
      return `${context.newCustomers30d} nouveau(x) client(s) sur les 30 derniers jours, sur ${context.totalCustomers} au total.`;
    }
    if (/(score|croissance)/.test(q)) {
      return context.growthScore !== null
        ? `Votre BYA Flow Score est actuellement de ${context.growthScore}/100.`
        : "Votre BYA Flow Score n'est pas encore calculable (pas assez d'historique).";
    }

    return "Je ne peux répondre qu'à des questions simples sur vos ventes, commandes, clients et produits pour l'instant. Essayez par exemple : \"Quel est mon chiffre d'affaires ?\", \"Quel est mon produit le plus vendu ?\" ou \"Combien de clients VIP ai-je ?\".";
  },
};
