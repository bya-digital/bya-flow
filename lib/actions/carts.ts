"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface LineItemInput {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export async function createCart(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const customerId = (formData.get("customerId") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const lineItems = (
    JSON.parse((formData.get("lineItems") as string) || "[]") as LineItemInput[]
  ).filter((item) => item.productId && Number(item.quantity) > 0);

  if (lineItems.length === 0) {
    redirect(
      `/paniers-abandonnes/nouveau?error=${encodeURIComponent(
        "Ajoutez au moins un produit au panier."
      )}`
    );
    return;
  }

  const supabase = createClient();

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .insert({ store_id: store.id, customer_id: customerId, notes })
    .select("id")
    .single<{ id: string }>();

  if (cartError || !cart) {
    redirect(
      `/paniers-abandonnes/nouveau?error=${encodeURIComponent(
        cartError?.message ?? "Erreur lors de la création du panier."
      )}`
    );
    return;
  }

  const { error: itemsError } = await supabase.from("cart_items").insert(
    lineItems.map((item) => ({
      cart_id: cart.id,
      product_id: item.productId,
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice),
    }))
  );

  if (itemsError) {
    redirect(`/paniers-abandonnes/${cart.id}?error=${encodeURIComponent(itemsError.message)}`);
  }

  revalidatePath("/paniers-abandonnes");
  redirect(`/paniers-abandonnes/${cart.id}`);
}

export async function updateCartStatus(formData: FormData) {
  const cartId = formData.get("cartId") as string;
  const status = formData.get("status") as string;
  const notes = (formData.get("notes") as string) || null;

  const supabase = createClient();
  const { error } = await supabase.from("carts").update({ status, notes }).eq("id", cartId);

  if (error) {
    redirect(`/paniers-abandonnes/${cartId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/paniers-abandonnes");
  revalidatePath(`/paniers-abandonnes/${cartId}`);
  redirect(`/paniers-abandonnes/${cartId}?success=1`);
}

export async function markCartReminded(formData: FormData) {
  const cartId = formData.get("cartId") as string;

  const supabase = createClient();
  const { error } = await supabase
    .from("carts")
    .update({ last_reminder_at: new Date().toISOString() })
    .eq("id", cartId);

  if (error) {
    redirect(`/paniers-abandonnes/${cartId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/paniers-abandonnes/${cartId}`);
  redirect(`/paniers-abandonnes/${cartId}?reminded=1`);
}

export async function convertCartToOrder(formData: FormData) {
  const cartId = formData.get("cartId") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();

  const [{ data: cart }, { data: items }] = await Promise.all([
    supabase.from("carts").select("*").eq("id", cartId).maybeSingle(),
    supabase.from("cart_items").select("product_id, quantity, unit_price").eq("cart_id", cartId),
  ]);

  if (!cart || !items || items.length === 0) {
    redirect(
      `/paniers-abandonnes/${cartId}?error=${encodeURIComponent("Panier introuvable ou vide.")}`
    );
    return;
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock")
    .in(
      "id",
      items.map((item) => item.product_id).filter((id): id is string => Boolean(id))
    );
  const stockById = new Map((products ?? []).map((p) => [p.id, p]));

  for (const item of items) {
    const product = item.product_id ? stockById.get(item.product_id) : null;
    if (product && item.quantity > product.stock) {
      redirect(
        `/paniers-abandonnes/${cartId}?error=${encodeURIComponent(
          `Stock insuffisant pour "${product.name}" (${product.stock} disponible(s)).`
        )}`
      );
      return;
    }
  }

  const total = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: store.id,
      customer_id: cart.customer_id,
      status: "pending",
      payment_status: "pending",
      total,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    redirect(
      `/paniers-abandonnes/${cartId}?error=${encodeURIComponent(
        orderError?.message ?? "Erreur lors de la conversion."
      )}`
    );
    return;
  }

  await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  );

  for (const item of items) {
    const product = item.product_id ? stockById.get(item.product_id) : null;
    if (!product) continue;
    await supabase
      .from("products")
      .update({ stock: product.stock - item.quantity })
      .eq("id", product.id);
  }

  await supabase.from("carts").update({ status: "converted" }).eq("id", cartId);

  revalidatePath("/paniers-abandonnes");
  revalidatePath("/commandes");
  revalidatePath("/produits");
  redirect(`/commandes/${order.id}`);
}
