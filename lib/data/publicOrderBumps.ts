import { createClient } from "@/lib/supabase/server";

export interface OrderBumpOffer {
  bumpProductId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  headline: string | null;
  description: string | null;
}

interface ProductImageRow {
  url: string;
  position: number;
}

// Une seule offre par produit déclencheur en base (pas de contrainte
// unique côté SQL, mais l'éditeur marchand n'en propose qu'une à la
// fois) — dédoublonnée ici par bump_product_id si plusieurs articles
// du panier déclenchent la même offre.
export async function getOrderBumpsForCart(
  storeId: string,
  cartProductIds: string[]
): Promise<OrderBumpOffer[]> {
  if (cartProductIds.length === 0) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("order_bumps")
    .select(
      "bump_product_id, headline, description, products!order_bumps_bump_product_id_fkey(name, price, status, product_images(url, position))"
    )
    .eq("store_id", storeId)
    .eq("is_active", true)
    .in("trigger_product_id", cartProductIds);

  const seen = new Set<string>();
  const offers: OrderBumpOffer[] = [];

  for (const row of data ?? []) {
    const product = row.products as unknown as {
      name: string;
      price: number;
      status: string;
      product_images: ProductImageRow[] | null;
    } | null;

    if (!product || product.status !== "active" || seen.has(row.bump_product_id)) continue;
    // Jamais proposer en bump un produit déjà présent dans le panier.
    if (cartProductIds.includes(row.bump_product_id)) continue;

    seen.add(row.bump_product_id);
    const images = (product.product_images ?? []).slice().sort((a, b) => a.position - b.position);

    offers.push({
      bumpProductId: row.bump_product_id,
      name: product.name,
      price: Number(product.price),
      imageUrl: images[0]?.url ?? null,
      headline: row.headline,
      description: row.description,
    });
  }

  return offers;
}
