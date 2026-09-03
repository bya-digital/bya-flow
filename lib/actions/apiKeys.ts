"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/apiKeys";
import { AVAILABLE_SCOPES } from "@/lib/apiScopes";
import { getCurrentMembership } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

export interface CreateApiKeyState {
  key: string | null;
  error: string | null;
}

// Retourne la clé en clair dans l'état plutôt que de rediriger avec un
// paramètre d'URL : une clé API ne doit jamais transiter par une URL
// (historique du navigateur, logs serveur, en-tête Referer...).
export async function createApiKey(
  _prevState: CreateApiKeyState,
  formData: FormData
): Promise<CreateApiKeyState> {
  const membership = await getCurrentMembership();
  if (!membership) return { key: null, error: "Session expirée, reconnectez-vous." };

  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return { key: null, error: "Nom requis." };

  const scopes = AVAILABLE_SCOPES.filter((scope) => formData.get(`scope_${scope}`) === "on");
  if (scopes.length === 0) return { key: null, error: "Sélectionnez au moins une permission." };

  const { fullKey, prefix, hash } = generateApiKey();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("api_keys").insert({
    organization_id: membership.organizationId,
    name,
    key_prefix: prefix,
    key_hash: hash,
    scopes,
    created_by: user?.id ?? null,
  });

  if (error) return { key: null, error: error.message };

  revalidatePath("/developpeurs");
  return { key: fullKey, error: null };
}

export async function revokeApiKey(formData: FormData) {
  const keyId = formData.get("keyId") as string;
  const supabase = createClient();
  await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId);
  revalidatePath("/developpeurs");
  redirect("/developpeurs");
}
