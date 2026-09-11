import { createClient } from "@/lib/supabase/server";
import { type CustomerSegment, SEGMENT_LABELS } from "@/lib/data/segments";

export type { CustomerSegment };
export { SEGMENT_LABELS };

export interface CustomerRfm {
  customerId: string;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  recencyDays: number;
  segment: CustomerSegment;
}

interface RfmRow {
  customer_id: string;
  order_count: number;
  total_spent: number;
  first_order_at: string;
  last_order_at: string;
}

// Score 1 (pire) à 5 (meilleur) selon la position de `value` dans la
// distribution réelle `values` de CETTE boutique — jamais un seuil
// absolu identique pour toutes (directive : "basé sur les données
// réelles"). Une boutique qui vend à 2 000 F et une autre à 2 000 000 F
// obtiennent chacune leurs propres quintiles cohérents.
function quintileScore(values: number[], value: number, higherIsBetter: boolean): number {
  if (values.length <= 1) return 3;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = sorted.findIndex((v) => v >= value);
  const percentile = rank / (sorted.length - 1);
  const score = Math.min(5, Math.max(1, Math.ceil(percentile * 5) || 1));
  return higherIsBetter ? score : 6 - score;
}

function computeRfmSegments(rows: RfmRow[]): Map<string, CustomerRfm> {
  const now = Date.now();
  const base = rows.map((row) => ({
    customerId: row.customer_id,
    orderCount: Number(row.order_count),
    totalSpent: Number(row.total_spent),
    firstOrderAt: row.first_order_at,
    lastOrderAt: row.last_order_at,
    recencyDays: Math.floor((now - new Date(row.last_order_at).getTime()) / 86_400_000),
  }));

  const recencyValues = base.map((r) => r.recencyDays);
  const frequencyValues = base.map((r) => r.orderCount);
  const monetaryValues = base.map((r) => r.totalSpent);

  const map = new Map<string, CustomerRfm>();
  for (const r of base) {
    const rScore = quintileScore(recencyValues, r.recencyDays, false);
    const fScore = quintileScore(frequencyValues, r.orderCount, true);
    const mScore = quintileScore(monetaryValues, r.totalSpent, true);

    let segment: CustomerSegment;
    if (r.orderCount === 1 && r.recencyDays <= 30) {
      segment = "new";
    } else if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
      segment = "vip";
    } else if (rScore <= 1) {
      segment = "inactive";
    } else if (rScore <= 2 && (fScore >= 3 || mScore >= 3)) {
      segment = "at_risk";
    } else {
      segment = "active";
    }

    map.set(r.customerId, { ...r, segment });
  }

  return map;
}

// Segmentation dynamique (directive Section 17) : un client sans
// commande n'apparaît pas ici (aucune donnée réelle à segmenter) — la
// page appelante garde son statut prospect/client existant pour lui.
export async function getCustomerRfmMap(storeId: string): Promise<Map<string, CustomerRfm>> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_customer_rfm", { p_store_id: storeId });
  return computeRfmSegments((data ?? []) as RfmRow[]);
}

// Variante organisation entière, pour le ciblage de campagnes
// (le CRM est déjà partagé entre boutiques d'une même organisation).
export async function getCustomerRfmMapByOrg(
  organizationId: string
): Promise<Map<string, CustomerRfm>> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_customer_rfm_by_org", {
    p_organization_id: organizationId,
  });
  return computeRfmSegments((data ?? []) as RfmRow[]);
}
