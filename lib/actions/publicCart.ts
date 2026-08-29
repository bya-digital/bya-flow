"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ProductRow {
  id: string;
  price: number;
  stock: number;
  status: string;
}

async function ensureCart(storeId: string): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("store_id", storeId)
    .eq("anon_user_id", user.id)
    .eq("status", "active")
    .maybeSingle<{ id: string }>();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("carts")
    .insert({ store_id: storeId, anon_user_id: user.id, status: "active" })
    .select("id")
    .single<{ id: string }>();

  return created?.id ?? null;
}

export async function addToCart(formData: FormData) {
  const storeId = formData.get("storeId") as string;
  const storeSlug = formData.get("storeSlug") as string;
  const productId = formData.get("productId") as string;
  const productSlug = formData.get("productSlug") as string;
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const productUrl = `/store/${storeSlug}/produits/${productSlug}`;

  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, price, stock, status")
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle<ProductRow>();

  if (!product || product.status !== "active") {
    redirect(`${productUrl}?error=${encodeURIComponent("Ce produit n'est plus disponible.")}`);
    return;
  }

  if (quantity > product.stock) {
    redirect(`${productUrl}?error=${encodeURIComponent("Stock insuffisant.")}`);
    return;
  }

  const cartId = await ensureCart(storeId);
  if (!cartId) {
    redirect(
      `${productUrl}?error=${encodeURIComponent("Impossible d'ajouter au panier, réessayez.")}`
    );
    return;
  }

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle<{ id: string; quantity: number }>();

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      redirect(`${productUrl}?error=${encodeURIComponent("Stock insuffisant.")}`);
      return;
    }
    await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", existingItem.id);
  } else {
    await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
      unit_price: product.price,
    });
  }

  revalidatePath(`/store/${storeSlug}`, "layout");
  redirect(`/store/${storeSlug}/panier`);
}

export async function updateCartItemQuantity(formData: FormData) {
  const storeSlug = formData.get("storeSlug") as string;
  const itemId = formData.get("itemId") as string;
  const quantity = Number(formData.get("quantity"));
  const cartUrl = `/store/${storeSlug}/panier`;

  const supabase = createClient();

  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", itemId);
  } else {
    const { data: item } = await supabase
      .from("cart_items")
      .select("product_id")
      .eq("id", itemId)
      .maybeSingle<{ product_id: string | null }>();

    if (item?.product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .maybeSingle<{ stock: number }>();

      if (product && quantity > product.stock) {
        redirect(`${cartUrl}?error=${encodeURIComponent("Stock insuffisant.")}`);
        return;
      }
    }
    await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
  }

  revalidatePath(cartUrl, "layout");
  redirect(cartUrl);
}

export async function removeCartItem(formData: FormData) {
  const storeSlug = formData.get("storeSlug") as string;
  const itemId = formData.get("itemId") as string;
  const cartUrl = `/store/${storeSlug}/panier`;

  const supabase = createClient();
  await supabase.from("cart_items").delete().eq("id", itemId);

  revalidatePath(cartUrl, "layout");
  redirect(cartUrl);
}
