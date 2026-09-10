import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : les cookies ne peuvent pas y être
            // écrits, le middleware se charge de rafraîchir la session.
          }
        },
      },
    }
  );
}

// `supabase.auth.getUser()` est un aller-retour réseau (vérification
// serveur, jamais fait confiance au cookie seul) — presque chaque
// fonction de données l'appelle indépendamment, donc une même page
// (layout + page + sous-composants) le déclenchait plusieurs fois de
// suite. `cache()` (React, mémoïsation par requête serveur) fait qu'un
// seul appel réel a lieu par requête, quel que soit le nombre de
// fonctions qui le demandent — jamais partagé entre deux requêtes
// différentes, ni entre deux visiteurs.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
