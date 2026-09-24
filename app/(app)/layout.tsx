import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { isPlatformAdmin } from "@/lib/data/platformAdmin";
import { getCurrentStore, getOrgStores } from "@/lib/data/store";
import { hasPermission, type PermissionKey, type TeamRole } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

interface MembershipRow {
  organizations: { name: string } | null;
  role: TeamRole;
  permissions: PermissionKey[] | null;
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let organizationName = "Mon organisation";
  let unreadNotifications = 0;
  let showAdminNav = true;
  let hideFinancesNav = false;
  let hideSettingsNav = false;
  let stores: { id: string; name: string }[] = [];

  if (user) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role, permissions, organizations(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle<MembershipRow & { organization_id: string }>();

    if (membership?.organizations) {
      organizationName = membership.organizations.name;
    }

    showAdminNav = membership?.role !== "member";
    hideFinancesNav = membership ? !hasPermission(membership, "finances") : false;
    hideSettingsNav = membership ? !hasPermission(membership, "settings") : false;

    if (membership?.organization_id) {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id)
        .is("read_at", null);
      unreadNotifications = count ?? 0;

      stores = await getOrgStores(membership.organization_id);
    }
  }

  const showPlatformAdmin = await isPlatformAdmin();
  const currentStore = stores.length > 1 ? await getCurrentStore() : null;

  return (
    <AppShell
      userEmail={user?.email ?? ""}
      organizationName={organizationName}
      unreadNotifications={unreadNotifications}
      showPlatformAdmin={showPlatformAdmin}
      showAdminNav={showAdminNav}
      hideFinancesNav={hideFinancesNav}
      hideSettingsNav={hideSettingsNav}
      stores={stores}
      currentStoreId={currentStore?.id ?? null}
    >
      {children}
    </AppShell>
  );
}
