import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

interface MembershipRow {
  organizations: { name: string } | null;
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let organizationName = "Mon organisation";

  if (user) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organizations(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle<MembershipRow>();

    if (membership?.organizations) {
      organizationName = membership.organizations.name;
    }
  }

  return (
    <AppShell userEmail={user?.email ?? ""} organizationName={organizationName}>
      {children}
    </AppShell>
  );
}
