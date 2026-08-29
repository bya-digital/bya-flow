import { createClient } from "@/lib/supabase/server";

export async function getWishlistProductIds(storeId: string): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return new Set();

  const { data } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("store_id", storeId);

  return new Set((data ?? []).map((row) => row.product_id as string));
}

export interface WishlistProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

interface ProductImageRow {
  url: string;
  position: number;
}

export async function getWishlistProducts(storeId: string): Promise<WishlistProduct[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return [];

  const { data } = await supabase
    .from("wishlist_items")
    .select("product_id, products(id, slug, name, price, stock, product_images(url, position))")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((row) => row.products as unknown as {
      id: string;
      slug: string;
      name: string;
      price: number;
      stock: number;
      product_images: ProductImageRow[] | null;
    } | null)
    .filter((product): product is NonNullable<typeof product> => product !== null)
    .map((product) => {
      const images = (product.product_images ?? []).slice().sort((a, b) => a.position - b.position);
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        imageUrl: images[0]?.url ?? null,
        stock: product.stock,
      };
    });
}
