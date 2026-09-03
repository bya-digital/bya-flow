import { hashApiKey } from "@/lib/apiKeys";
import { createClient } from "@/lib/supabase/server";

export interface ApiAuthOk {
  organizationId: string;
  scopes: string[];
}

export interface ApiAuthError {
  error: string;
  status: number;
}

interface AuthenticateRow {
  organization_id: string;
  scopes: string[];
}

// Le client Supabase ici utilise seulement la clé anon (jamais
// service_role, absente de ce projet) : api_authenticate() est une
// fonction SECURITY DEFINER, seul point qui contourne la RLS pour cette
// vérification précise, pas un accès général à toutes les données.
export async function authenticateApiRequest(
  request: Request,
  requiredScope: string
): Promise<ApiAuthOk | ApiAuthError> {
  const authHeader = request.headers.get("authorization") ?? "";
  const key = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!key) {
    return { error: "En-tête Authorization manquant. Utilisez : Bearer <clé API>.", status: 401 };
  }

  const supabase = createClient();
  const { data } = await supabase
    .rpc("api_authenticate", { p_key_hash: hashApiKey(key) })
    .maybeSingle<AuthenticateRow>();

  if (!data) {
    return { error: "Clé API invalide ou révoquée.", status: 401 };
  }

  if (!data.scopes.includes(requiredScope)) {
    return { error: `Cette clé API n'a pas la permission "${requiredScope}".`, status: 403 };
  }

  return { organizationId: data.organization_id, scopes: data.scopes };
}
