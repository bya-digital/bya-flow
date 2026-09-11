// Séparé de lib/data/crm.ts (qui importe le client Supabase serveur)
// pour rester importable depuis un composant client comme CampaignForm.
export type CustomerSegment = "new" | "vip" | "at_risk" | "inactive" | "active";

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  new: "Nouveau",
  vip: "VIP",
  at_risk: "À risque",
  inactive: "Inactif",
  active: "Actif",
};
