// Catalogue des plans BYA Flow. Aucune passerelle de paiement n'est
// connectée à ce stade (cahier des charges : ne pas intégrer de service
// externe complexe sans nécessité) — changer de plan est immédiat et
// gratuit tant qu'aucun moyen de paiement n'existe. Le prix affiché sert
// de référence pour une future intégration (Stripe ou équivalent).

export type PlanId = "free" | "starter" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxTeamMembers: number;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    maxProducts: 10,
    maxOrdersPerMonth: 20,
    maxTeamMembers: 1,
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    maxProducts: 100,
    maxOrdersPerMonth: 200,
    maxTeamMembers: 3,
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    maxProducts: 1000,
    maxOrdersPerMonth: 2000,
    maxTeamMembers: 10,
  },
  {
    id: "business",
    name: "Business",
    price: 99,
    maxProducts: Infinity,
    maxOrdersPerMonth: Infinity,
    maxTeamMembers: Infinity,
  },
];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

export function formatLimit(value: number): string {
  return Number.isFinite(value) ? value.toString() : "Illimité";
}
