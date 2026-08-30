import { createClient } from "@/lib/supabase/server";

export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  currency: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  heroCtaLabel: string | null;
  accentColor: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialWhatsapp: string | null;
  footerText: string | null;
}

export async function getPublicStoreBySlug(slug: string): Promise<PublicStore | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stores")
    .select(
      "id, name, slug, description, logo_url, currency, hero_title, hero_subtitle, hero_image_url, hero_cta_label, accent_color, social_facebook, social_instagram, social_tiktok, social_whatsapp, footer_text"
    )
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
    heroTitle: data.hero_title,
    heroSubtitle: data.hero_subtitle,
    heroImageUrl: data.hero_image_url,
    heroCtaLabel: data.hero_cta_label,
    accentColor: data.accent_color,
    socialFacebook: data.social_facebook,
    socialInstagram: data.social_instagram,
    socialTiktok: data.social_tiktok,
    socialWhatsapp: data.social_whatsapp,
    footerText: data.footer_text,
  };
}

export interface PublicTestimonial {
  id: string;
  authorName: string;
  quote: string;
}

export async function getPublicTestimonials(storeId: string): Promise<PublicTestimonial[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("store_testimonials")
    .select("id, author_name, quote")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    authorName: row.author_name,
    quote: row.quote,
  }));
}

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
}

export async function getPublicFaqs(storeId: string): Promise<PublicFaq[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("store_faqs")
    .select("id, question, answer")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
  }));
}

export interface PublicShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  freeAbove: number | null;
}

export async function getPublicShippingMethods(storeId: string): Promise<PublicShippingMethod[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shipping_methods")
    .select("id, name, description, price, free_above")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((method) => ({
    id: method.id,
    name: method.name,
    description: method.description,
    price: Number(method.price),
    freeAbove: method.free_above !== null ? Number(method.free_above) : null,
  }));
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

export interface SitemapStore {
  slug: string;
}

export async function getAllActiveStoreSlugs(): Promise<SitemapStore[]> {
  const supabase = createClient();
  const { data } = await supabase.from("stores").select("slug").eq("is_active", true);

  return (data ?? []).map((s) => ({ slug: s.slug }));
}

export interface SitemapProduct {
  storeSlug: string;
  productSlug: string;
}

export async function getAllActiveProductSlugs(): Promise<SitemapProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("slug, stores!inner(slug, is_active)")
    .eq("status", "active")
    .eq("stores.is_active", true);

  return (data ?? []).map((p) => ({
    storeSlug: (p.stores as unknown as { slug: string }).slug,
    productSlug: p.slug,
  }));
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
