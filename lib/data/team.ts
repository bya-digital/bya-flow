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

interface MemberRow {
  id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
}

interface MemberProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
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

// organization_members et profiles référencent tous les deux auth.users
// (jamais l'un l'autre) : PostgREST ne peut donc pas inférer d'embed
// profiles(...) sur organization_members (pas de FK directe). Deux
// requêtes séparées, jointes ici côté code.
export async function getTeamMembers(organizationId: string): Promise<TeamMember[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .returns<MemberRow[]>();

  const rows = members ?? [];
  if (rows.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in(
      "id",
      rows.map((row) => row.user_id)
    )
    .returns<MemberProfileRow[]>();

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    fullName: profileById.get(row.user_id)?.full_name ?? null,
    email: profileById.get(row.user_id)?.email ?? null,
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
