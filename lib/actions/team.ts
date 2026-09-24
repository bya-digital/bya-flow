"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMembership, PERMISSION_LABELS, type PermissionKey } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

const INVITABLE_ROLES = ["admin", "member"];
const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

// Les cases à cocher sont pré-cochées (accès complet, comportement
// actuel) — si TOUTES restent cochées à l'envoi, on enregistre `null`
// (accès complet, jamais une restriction silencieuse). Ce n'est que
// si l'admin décoche au moins une case qu'une restriction explicite
// (potentiellement une liste vide) est enregistrée.
function readPermissions(formData: FormData): PermissionKey[] | null {
  const checked = formData.getAll("permissions") as PermissionKey[];
  return checked.length === ALL_PERMISSION_KEYS.length ? null : checked;
}

export async function inviteMember(formData: FormData) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const email = (formData.get("email") as string).trim().toLowerCase();
  const role = formData.get("role") as string;

  if (!INVITABLE_ROLES.includes(role)) {
    redirect(`/equipe?error=${encodeURIComponent("Rôle invalide.")}`);
  }

  // La restriction ne veut dire quelque chose que pour un membre
  // simple — un futur admin garde de toute façon un accès complet.
  const permissions = role === "member" ? readPermissions(formData) : null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: membership.organizationId,
    email,
    role,
    permissions,
    invited_by: user?.id,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "Une invitation est déjà en attente pour cet email."
        : error.message;
    redirect(`/equipe?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/equipe");
  redirect("/equipe?success=invite");
}

export async function revokeInvitation(formData: FormData) {
  const invitationId = formData.get("invitationId") as string;
  const supabase = createClient();
  const { error } = await supabase
    .from("organization_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    redirect(`/equipe?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function updateMemberRole(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const role = formData.get("role") as string;

  if (!INVITABLE_ROLES.includes(role)) {
    redirect(`/equipe?error=${encodeURIComponent("Rôle invalide.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    redirect(
      `/equipe?error=${encodeURIComponent(
        "Impossible de modifier ce rôle : " + error.message
      )}`
    );
  }

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function updateMemberPermissions(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const permissions = readPermissions(formData);

  const supabase = createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ permissions })
    .eq("id", memberId);

  if (error) {
    redirect(
      `/equipe?error=${encodeURIComponent(
        "Impossible de modifier ces droits : " + error.message
      )}`
    );
  }

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function removeMember(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const supabase = createClient();
  const { error } = await supabase.from("organization_members").delete().eq("id", memberId);

  if (error) {
    redirect(
      `/equipe?error=${encodeURIComponent(
        "Impossible de retirer ce membre : " + error.message
      )}`
    );
  }

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function acceptInvitation(formData: FormData) {
  const token = formData.get("token") as string;
  const supabase = createClient();

  const { error } = await supabase.rpc("accept_organization_invitation", { p_token: token });

  if (error) {
    redirect(`/rejoindre/${token}?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?welcome=1");
}
