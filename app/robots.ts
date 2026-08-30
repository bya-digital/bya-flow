import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bya-flow.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/store/",
        disallow: [
          "/dashboard",
          "/onboarding",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/produits",
          "/produits/",
          "/commandes",
          "/commandes/",
          "/clients",
          "/clients/",
          "/campagnes",
          "/campagnes/",
          "/automatisations",
          "/automatisations/",
          "/promotions",
          "/promotions/",
          "/paniers-abandonnes",
          "/paniers-abandonnes/",
          "/boutique",
          "/boutique/",
          "/livraison",
          "/livraison/",
          "/paiements",
          "/avis",
          "/facturation",
          "/analytics",
          "/notifications",
          "/parametres",
          "/audit",
          "/ia",
          "/admin-plateforme",
          "/store/*/compte",
          "/store/*/panier",
          "/store/*/checkout",
          "/store/*/commande",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
