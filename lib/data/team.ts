import { createClient } from "@/lib/supabase/server";

export type TeamRole = "owner" | "admin" | "member";

export interface CurrentMembership {
  organizationId: string;
  role: TeamRole;
}

export async function getCurrentMembership(): Promise<CurrentMembership | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ organization_id: string; role: TeamRole }>();

  if (!data) return null;
  return { organizationId: data.organization_id, role: data.role };
}

interface MemberProfile {
  full_name: string | null;
  email: string | null;
}

interface MemberRow {
  id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
  profiles: MemberProfile | null;
}

export interface TeamMember {
  id: string;
  userId: string;
  role: TeamRole;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  isSelf: boolean;
}

export async function getTeamMembers(organizationId: string): Promise<TeamMember[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("organization_members")
    .select("id, user_id, role, created_at, profiles(full_name, email)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .returns<MemberRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    fullName: row.profiles?.full_name ?? null,
    email: row.profiles?.email ?? null,
    createdAt: row.created_at,
    isSelf: row.user_id === user?.id,
  }));
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: "admin" | "member";
  token: string;
  createdAt: string;
}

export async function getPendingInvitations(organizationId: string): Promise<PendingInvitation[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("organization_invitations")
    .select("id, email, role, token, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as "admin" | "member",
    token: row.token,
    createdAt: row.created_at,
  }));
}

interface InvitationPreviewRow {
  organization_name: string;
  invite_email: string;
  invite_role: string;
  invite_status: string;
}

export interface InvitationPreview {
  organizationName: string;
  email: string;
  role: string;
  status: string;
}

export async function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
  const supabase = createClient();
  const { data } = await supabase
    .rpc("get_invitation_preview", { p_token: token })
    .maybeSingle<InvitationPreviewRow>();

  if (!data) return null;

  return {
    organizationName: data.organization_name,
    email: data.invite_email,
    role: data.invite_role,
    status: data.invite_status,
  };
}
