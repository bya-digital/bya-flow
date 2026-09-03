import { getPlan } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_platform_admin: boolean }>();

  return data?.is_platform_admin ?? false;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  createdAt: string;
  plan: string;
  memberCount: number;
  storeCount: number;
}

export interface PlatformOverview {
  organizations: PlatformOrganization[];
  totalOrganizations: number;
  totalStores: number;
  mrr: number;
  planBreakdown: Record<string, number>;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const supabase = createClient();

  const [{ data: organizations }, { data: subscriptions }, { data: members }, { data: stores }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("organization_id, plan"),
      supabase.from("organization_members").select("organization_id"),
      supabase.from("stores").select("organization_id"),
    ]);

  const planByOrg = new Map(
    (subscriptions ?? []).map((row) => [row.organization_id as string, row.plan as string])
  );

  const memberCountByOrg = new Map<string, number>();
  for (const row of members ?? []) {
    const orgId = row.organization_id as string;
    memberCountByOrg.set(orgId, (memberCountByOrg.get(orgId) ?? 0) + 1);
  }

  const storeCountByOrg = new Map<string, number>();
  for (const row of stores ?? []) {
    const orgId = row.organization_id as string;
    storeCountByOrg.set(orgId, (storeCountByOrg.get(orgId) ?? 0) + 1);
  }

  const planBreakdown: Record<string, number> = {};
  let mrr = 0;

  const orgRows: PlatformOrganization[] = (organizations ?? []).map((org) => {
    const plan = planByOrg.get(org.id) ?? "free";
    planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1;
    mrr += getPlan(plan).price;
    return {
      id: org.id,
      name: org.name,
      createdAt: org.created_at,
      plan,
      memberCount: memberCountByOrg.get(org.id) ?? 0,
      storeCount: storeCountByOrg.get(org.id) ?? 0,
    };
  });

  return {
    organizations: orgRows,
    totalOrganizations: orgRows.length,
    totalStores: (stores ?? []).length,
    mrr,
    planBreakdown,
  };
}

export interface PendingCustomDomain {
  storeId: string;
  storeName: string;
  domain: string;
}

export async function getPendingCustomDomains(): Promise<PendingCustomDomain[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, custom_domain")
    .not("custom_domain", "is", null)
    .is("custom_domain_verified_at", null);

  return (data ?? []).map((row) => ({
    storeId: row.id,
    storeName: row.name,
    domain: row.custom_domain as string,
  }));
}
