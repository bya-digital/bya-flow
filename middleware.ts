import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SITE_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://bya-flow.vercel.app"
).hostname;

// Domaine personnalisé (Phase 34) : un marchand qui a rattaché son propre
// domaine à sa boutique le voit servi directement à la racine (jamais
// /store/[slug]) — résolu ici en dehors du client cookie-aware du reste
// du middleware, cette vérification n'a besoin d'aucune session, juste
// d'une lecture publique (déjà couverte par stores_select_public).
async function resolveCustomDomain(hostname: string): Promise<string | null> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("stores")
    .select("slug")
    .eq("custom_domain", hostname)
    .eq("is_active", true)
    .not("custom_domain_verified_at", "is", null)
    .maybeSingle<{ slug: string }>();

  return data?.slug ?? null;
}

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/sw.js",
];

export async function middleware(request: NextRequest) {
  // API publique (Phase 31) : authentifiée par clé API dans l'en-tête
  // Authorization, jamais par la session marchand — un appelant externe
  // n'a aucun cookie, donc jamais aucune des vérifications ci-dessous à
  // faire ici.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  let rewriteTarget: URL | null = null;

  if (hostname && hostname !== "localhost" && hostname !== SITE_HOSTNAME && !hostname.endsWith(".vercel.app")) {
    const slug = await resolveCustomDomain(hostname);
    if (slug) {
      const target = request.nextUrl.clone();
      target.pathname = `/store/${slug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
      rewriteTarget = target;
    }
  }

  let response = rewriteTarget
    ? NextResponse.rewrite(rewriteTarget)
    : NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Reconstruire la réponse doit préserver la réécriture vers
          // /store/[slug] posée plus haut (Phase 34) — sinon un cookie
          // posé ici (session anonyme, parrainage...) écraserait le
          // domaine personnalisé et renverrait la page normale non
          // réécrite à la place de la boutique.
          response = rewriteTarget ? NextResponse.rewrite(rewriteTarget) : NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Une session anonyme (Phase 6 : panier boutique publique) a un
  // auth.uid() mais pas d'email — elle ne doit jamais compter comme "déjà
  // connecté" côté espace marchand (sinon un visiteur qui a simplement
  // parcouru une boutique ne pourrait plus atteindre /login normalement).
  const isRealUser = Boolean(user?.email);

  // Domaine personnalisé : tout le reste de la fonction doit raisonner
  // sur le chemin réécrit (/store/[slug]/...), jamais le chemin d'origine
  // (/, /produits/xyz...) qui n'existe pas tel quel dans l'app.
  const pathname = rewriteTarget ? rewriteTarget.pathname : request.nextUrl.pathname;
  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/store/") ||
    pathname.startsWith("/rejoindre/");

  // Parrainage (Phase 28) : mémorise le code de parrainage dans un cookie
  // dès la visite du lien ?ref=, pour l'attribuer plus tard au panier
  // (potentiellement créé sur une tout autre page). Jamais résolu ici —
  // juste stocké ; la résolution en id client se fait côté serveur au
  // moment de la création du panier.
  if (pathname.startsWith("/store/")) {
    const ref = request.nextUrl.searchParams.get("ref");
    if (ref) {
      response.cookies.set("bya_ref", ref, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }
  }

  if (!user) {
    if (pathname.startsWith("/store/")) {
      // Panier anonyme (Phase 6) : donne un auth.uid() stable au visiteur
      // sans compte, via une session Supabase anonyme (cookie), pour que
      // son panier survive d'une page à l'autre.
      await supabase.auth.signInAnonymously();
      return response;
    }
    if (isPublicPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (!isRealUser) {
    if (isPublicPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" || pathname === "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isPublicPath) return response;

  // Un utilisateur authentifié mais sans organisation doit terminer
  // l'onboarding avant d'accéder au reste de l'application.
  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasOrganization = Boolean(count);

  if (!hasOrganization && pathname !== "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (hasOrganization && pathname === "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
