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

export async function createOrder(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const customerId = (formData.get("customerId") as string) || null;
  const status = (formData.get("status") as string) || "pending";
  const paymentStatus = (formData.get("paymentStatus") as string) || "pending";
  const notes = (formData.get("notes") as string) || null;
  const shippingAddress = {
    name: (formData.get("shippingName") as string) || "",
    address: (formData.get("shippingAddressLine") as string) || "",
    city: (formData.get("shippingCity") as string) || "",
    postalCode: (formData.get("shippingPostalCode") as string) || "",
    country: (formData.get("shippingCountry") as string) || "",
  };

  const lineItems = (
    JSON.parse((formData.get("lineItems") as string) || "[]") as LineItemInput[]
  ).filter((item) => item.productId && Number(item.quantity) > 0);

  if (lineItems.length === 0) {
    redirect(
      `/commandes/nouvelle?error=${encodeURIComponent("Ajoutez au moins un produit à la commande.")}`
    );
    return;
  }

  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock")
    .in(
      "id",
      lineItems.map((item) => item.productId)
    );

  const stockById = new Map((products ?? []).map((p) => [p.id, p as { id: string; name: string; stock: number }]));

  for (const item of lineItems) {
    const product = stockById.get(item.productId);
    const quantity = Number(item.quantity);
    if (product && quantity > product.stock) {
      redirect(
        `/commandes/nouvelle?error=${encodeURIComponent(
          `Stock insuffisant pour "${product.name}" (${product.stock} disponible(s)).`
        )}`
      );
      return;
    }
  }

  const total = lineItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: store.id,
      customer_id: customerId,
      status,
      payment_status: paymentStatus,
      shipping_address: shippingAddress,
      notes,
      total,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    redirect(
      `/commandes/nouvelle?error=${encodeURIComponent(
        orderError?.message ?? "Erreur lors de la création de la commande."
      )}`
    );
    return;
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    lineItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice),
    }))
  );

  if (itemsError) {
    redirect(`/commandes/${order.id}?error=${encodeURIComponent(itemsError.message)}`);
  }

  for (const item of lineItems) {
    const product = stockById.get(item.productId);
    if (!product) continue;
    await supabase
      .from("products")
      .update({ stock: product.stock - Number(item.quantity) })
      .eq("id", item.productId);
  }

  revalidatePath("/commandes");
  revalidatePath("/produits");
  redirect(`/commandes/${order.id}`);
}

export async function updateOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as string;
  const paymentStatus = formData.get("paymentStatus") as string;
  const notes = (formData.get("notes") as string) || null;
  const shippingAddress = {
    name: (formData.get("shippingName") as string) || "",
    address: (formData.get("shippingAddressLine") as string) || "",
    city: (formData.get("shippingCity") as string) || "",
    postalCode: (formData.get("shippingPostalCode") as string) || "",
    country: (formData.get("shippingCountry") as string) || "",
  };

  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status, payment_status: paymentStatus, notes, shipping_address: shippingAddress })
    .eq("id", orderId);

  if (error) {
    redirect(`/commandes/${orderId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/commandes");
  revalidatePath(`/commandes/${orderId}`);
  redirect(`/commandes/${orderId}?success=1`);
}
