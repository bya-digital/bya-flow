import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { isPlatformAdmin } from "@/lib/data/platformAdmin";
import { createClient } from "@/lib/supabase/server";

interface MembershipRow {
  organizations: { name: string } | null;
  role: string;
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let organizationName = "Mon organisation";
  let unreadNotifications = 0;
  let showAdminNav = true;

  if (user) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle<MembershipRow & { organization_id: string }>();

    if (membership?.organizations) {
      organizationName = membership.organizations.name;
    }

    showAdminNav = membership?.role !== "member";

    if (membership?.organization_id) {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id)
        .is("read_at", null);
      unreadNotifications = count ?? 0;
    }
  }

  const showPlatformAdmin = await isPlatformAdmin();

  return (
    <AppShell
      userEmail={user?.email ?? ""}
      organizationName={organizationName}
      unreadNotifications={unreadNotifications}
      showPlatformAdmin={showPlatformAdmin}
      showAdminNav={showAdminNav}
    >
      {children}
    </AppShell>
  );
}
