// Calcul du BYA Flow Score : logique pure, sans accès base de données, pour
// pouvoir faire évoluer l'algorithme (poids, facteurs) sans toucher au reste
// de l'application. Chaque facteur est noté indépendamment sur 0-100 puis
// combiné par une moyenne pondérée.

export interface GrowthScoreInputs {
  currentRevenue: number;
  previousRevenue: number;
  currentAverageBasket: number;
  previousAverageBasket: number;
  /** 0-100, ou null si aucun panier sur la période (rien à mesurer). */
  conversionRate: number | null;
  totalCustomers: number;
  /** Clients distincts ayant commandé sur la période. */
  activeCustomers: number;
  ordersCount: number;
  distinctOrderingCustomers: number;
  cartsAbandoned: number;
  cartsTotal: number;
  activeProductsCount: number;
  productsWithSalesCount: number;
  campaignsSentRecently: number;
}

export interface ScoreFactor {
  key: string;
  label: string;
  /** Note du facteur, 0-100. */
  value: number;
  /** Poids dans le score final, 0-1. */
  weight: number;
  hint: string;
}

export type ScoreBand = "critique" | "faible" | "moyen" | "bon" | "excellent";

export interface GrowthScoreResult {
  score: number;
  band: ScoreBand;
  bandLabel: string;
  factors: ScoreFactor[];
}

export const DEFAULT_WEIGHTS = {
  sales: 0.2,
  conversion: 0.15,
  customerActivity: 0.15,
  averageBasket: 0.1,
  purchaseFrequency: 0.15,
  cartAbandonment: 0.1,
  productPerformance: 0.1,
  campaigns: 0.05,
} as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/** -50% -> 0, 0% -> 50, +50% ou plus -> 100. Neutre (pas de baisse) si pas d'historique. */
function growthToScore(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 70 : 50;
  }
  const change = (current - previous) / previous;
  return clamp(50 + change * 100);
}

export function calculateGrowthScore(
  inputs: GrowthScoreInputs,
  weights: Record<keyof typeof DEFAULT_WEIGHTS, number> = DEFAULT_WEIGHTS
): GrowthScoreResult {
  const salesScore = growthToScore(inputs.currentRevenue, inputs.previousRevenue);
  const basketScore = growthToScore(inputs.currentAverageBasket, inputs.previousAverageBasket);
  const conversionScore = inputs.conversionRate ?? 50;

  const customerActivityScore =
    inputs.totalCustomers > 0
      ? clamp((inputs.activeCustomers / inputs.totalCustomers) * 100)
      : 50;

  const frequencyRatio =
    inputs.distinctOrderingCustomers > 0
      ? inputs.ordersCount / inputs.distinctOrderingCustomers
      : 0;
  const frequencyScore =
    inputs.distinctOrderingCustomers > 0 ? clamp(50 + (frequencyRatio - 1) * 50) : 50;

  const cartAbandonmentScore =
    inputs.cartsTotal > 0
      ? clamp(100 - (inputs.cartsAbandoned / inputs.cartsTotal) * 100)
      : 50;

  const productPerformanceScore =
    inputs.activeProductsCount > 0
      ? clamp((inputs.productsWithSalesCount / inputs.activeProductsCount) * 100)
      : 50;

  const campaignsScore = inputs.campaignsSentRecently > 0 ? 100 : 50;

  const factors: ScoreFactor[] = [
    {
      key: "sales",
      label: "Évolution des ventes",
      value: Math.round(salesScore),
      weight: weights.sales,
      hint: "Chiffre d'affaires vs la période précédente",
    },
    {
      key: "conversion",
      label: "Conversion panier → commande",
      value: Math.round(conversionScore),
      weight: weights.conversion,
      hint: "Part des paniers transformés en commande",
    },
    {
      key: "customerActivity",
      label: "Activité client",
      value: Math.round(customerActivityScore),
      weight: weights.customerActivity,
      hint: "Part de clients ayant commandé récemment",
    },
    {
      key: "averageBasket",
      label: "Évolution du panier moyen",
      value: Math.round(basketScore),
      weight: weights.averageBasket,
      hint: "Panier moyen vs la période précédente",
    },
    {
      key: "purchaseFrequency",
      label: "Fréquence d'achat",
      value: Math.round(frequencyScore),
      weight: weights.purchaseFrequency,
      hint: "Commandes par client actif",
    },
    {
      key: "cartAbandonment",
      label: "Paniers abandonnés",
      value: Math.round(cartAbandonmentScore),
      weight: weights.cartAbandonment,
      hint: "Part des paniers non convertis",
    },
    {
      key: "productPerformance",
      label: "Performance produits",
      value: Math.round(productPerformanceScore),
      weight: weights.productPerformance,
      hint: "Part du catalogue actif ayant généré une vente",
    },
    {
      key: "campaigns",
      label: "Activité marketing",
      value: Math.round(campaignsScore),
      weight: weights.campaigns,
      hint: "Campagne envoyée récemment",
    },
  ];

  const score = clamp(Math.round(factors.reduce((sum, f) => sum + f.value * f.weight, 0)));

  let band: ScoreBand;
  let bandLabel: string;
  if (score <= 30) {
    band = "critique";
    bandLabel = "Critique";
  } else if (score <= 50) {
    band = "faible";
    bandLabel = "Faible";
  } else if (score <= 70) {
    band = "moyen";
    bandLabel = "Moyen";
  } else if (score <= 85) {
    band = "bon";
    bandLabel = "Bon";
  } else {
    band = "excellent";
    bandLabel = "Excellent";
  }

  return { score, band, bandLabel, factors };
}
