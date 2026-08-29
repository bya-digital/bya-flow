import { createClient } from "@/lib/supabase/server";

export interface PublicCartItem {
  id: string;
  productId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
}

export interface PublicCart {
  id: string | null;
  items: PublicCartItem[];
  subtotal: number;
}

interface ProductImageRow {
  url: string;
  position: number;
}

interface CartItemProductRow {
  name: string;
  slug: string;
  stock: number;
  product_images: ProductImageRow[] | null;
}

const emptyCart: PublicCart = { id: null, items: [], subtotal: 0 };

export async function getPublicCart(storeId: string): Promise<PublicCart> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return emptyCart;

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("store_id", storeId)
    .eq("anon_user_id", user.id)
    .eq("status", "active")
    .maybeSingle<{ id: string }>();

  if (!cart) return emptyCart;

  const { data: items } = await supabase
    .from("cart_items")
    .select(
      "id, product_id, quantity, unit_price, products(name, slug, stock, product_images(url, position))"
    )
    .eq("cart_id", cart.id)
    .order("id", { ascending: true });

  const rows: PublicCartItem[] = (items ?? []).map((item) => {
    const product = item.products as unknown as CartItemProductRow | null;
    const images = (product?.product_images ?? [])
      .slice()
      .sort((a, b) => a.position - b.position);

    return {
      id: item.id,
      productId: item.product_id,
      name: product?.name ?? "Produit indisponible",
      slug: product?.slug ?? "",
      imageUrl: images[0]?.url ?? null,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      stock: product?.stock ?? 0,
    };
  });

  const subtotal = rows.reduce((sum, row) => sum + row.unitPrice * row.quantity, 0);

  return { id: cart.id, items: rows, subtotal };
}
