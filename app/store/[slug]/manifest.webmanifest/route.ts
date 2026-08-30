import { NextResponse } from "next/server";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

// manifest.ts (le fichier spécial Next.js) n'est reconnu qu'à la racine de
// l'app, jamais par segment de route (contrairement à icon.tsx ou
// opengraph-image.tsx) — confirmé en conditions réelles (le build ne
// générait aucune route pour app/store/[slug]/manifest.ts). Un Route
// Handler, lui, fonctionne normalement sous un segment dynamique : c'est
// ce qui permet un manifeste distinct par boutique, référencé depuis
// generateMetadata() dans app/store/[slug]/layout.tsx.
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const store = await getPublicStoreBySlug(params.slug);

  const name = store?.name ?? "Boutique BYA Flow";
  const icons = store?.logoUrl
    ? [{ src: store.logoUrl, sizes: "512x512", type: "image/png" }]
    : [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ];

  const manifest = {
    name,
    short_name: name.length > 12 ? name.slice(0, 12) : name,
    description: store?.description || `Boutique en ligne ${name}, propulsée par BYA Flow.`,
    start_url: `/store/${params.slug}`,
    scope: `/store/${params.slug}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: store?.accentColor || "#2563eb",
    icons,
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
