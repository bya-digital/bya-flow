import type { MetadataRoute } from "next";
import { getAllActiveProductSlugs, getAllActiveStoreSlugs } from "@/lib/data/publicStore";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bya-flow.vercel.app";

  const [stores, products] = await Promise.all([
    getAllActiveStoreSlugs(),
    getAllActiveProductSlugs(),
  ]);

  const storeEntries: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${siteUrl}/store/${store.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/store/${product.storeSlug}/produits/${product.productSlug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    ...storeEntries,
    ...productEntries,
  ];
}
