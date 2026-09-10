import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Vérifie le lien reçu par email (confirmation d'inscription, mot de passe
// oublié, changement d'email) via token_hash + verifyOtp() plutôt que le
// flux PKCE (exchangeCodeForSession) : le code PKCE exige que le lien soit
// ouvert dans le MÊME navigateur que celui qui a fait la demande (cookie
// code_verifier), ce qui échoue systématiquement quand l'utilisateur ouvre
// son email depuis son téléphone ou une autre application — cas de très
// loin le plus fréquent. token_hash ne dépend d'aucun cookie et fonctionne
// donc sur n'importe quel appareil.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? `${origin}/dashboard`;
  const redirectUrl = next.startsWith("http") ? next : `${origin}${next}`;

  if (tokenHash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Le lien est invalide ou a expiré.")}`
  );
}
