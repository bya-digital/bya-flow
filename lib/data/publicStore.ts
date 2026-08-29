import { createClient } from "@/lib/supabase/server";

export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  currency: string;
}

export async function getPublicStoreBySlug(slug: string): Promise<PublicStore | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, slug, description, logo_url, currency")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    logoUrl: data.logo_url,
    currency: data.currency,
  };
}

interface ProductImageRow {
  url: string;
  position: number;
}

interface ProductVariantRow {
  id: string;
  name: string;
  price: number | null;
  stock: number;
}

export interface PublicProductSummary {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  stock: number;
}

function firstImage(images: ProductImageRow[] | null): string | null {
  if (!images || images.length === 0) return null;
  return [...images].sort((a, b) => a.position - b.position)[0].url;
}

export async function getPublicProducts(storeId: string): Promise<PublicProductSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("id, slug, name, price, compare_at_price, stock, product_images(url, position)")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    compareAtPrice: p.compare_at_price !== null ? Number(p.compare_at_price) : null,
    imageUrl: firstImage(p.product_images as ProductImageRow[] | null),
    stock: p.stock,
  }));
}

export interface PublicProductDetail extends PublicProductSummary {
  description: string | null;
  images: string[];
  variants: ProductVariantRow[];
}

export async function getPublicProductBySlug(
  storeId: string,
  productSlug: string
): Promise<PublicProductDetail | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, slug, name, price, compare_at_price, stock, description, product_images(url, position), product_variants(id, name, price, stock)"
    )
    .eq("store_id", storeId)
    .eq("slug", productSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  const images = ((data.product_images as ProductImageRow[] | null) ?? []).sort(
    (a, b) => a.position - b.position
  );

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    price: Number(data.price),
    compareAtPrice: data.compare_at_price !== null ? Number(data.compare_at_price) : null,
    imageUrl: images[0]?.url ?? null,
    images: images.map((i) => i.url),
    stock: data.stock,
    description: data.description,
    variants: (data.product_variants as ProductVariantRow[] | null) ?? [],
  };
}
