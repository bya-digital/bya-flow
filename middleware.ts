import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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

  const { pathname } = request.nextUrl;
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
