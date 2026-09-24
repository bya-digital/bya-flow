// Séparé de lib/data/team.ts (qui importe le client Supabase serveur)
// pour rester importable depuis des composants client comme
// InviteMemberForm et MemberRow — même raison que lib/data/segments.ts.

export type TeamRole = "owner" | "admin" | "member";

// Zones restreignables pour un membre simple ('member') — owner/admin
// gardent toujours un accès complet, quoi que porte cette colonne
// pour eux. `permissions` à null = accès complet (comportement par
// défaut, jamais une réduction silencieuse d'un membre déjà en place).
export type PermissionKey = "finances" | "settings";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  finances: "Finances (chiffre d'affaires, facturation)",
  settings: "Réglages boutique (apparence, domaine, tracking)",
};

// owner/admin : toujours vrai. member : vrai si `permissions` est
// null (accès complet par défaut) ou contient explicitement la clé.
export function hasPermission(
  membership: { role: TeamRole; permissions: PermissionKey[] | null } | null,
  key: PermissionKey
): boolean {
  if (!membership) return false;
  if (membership.role !== "member") return true;
  return membership.permissions === null || membership.permissions.includes(key);
}
