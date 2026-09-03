"use server";

import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface PosOrderResult {
  id: string;
}

export async function createPosSale(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const itemsRaw = (formData.get("items") as string) || "[]";
  const customerName = ((formData.get("customerName") as string) || "").trim() || null;
  const customerEmail = ((formData.get("customerEmail") as string) || "").trim() || null;
  const customerPhone = ((formData.get("customerPhone") as string) || "").trim() || null;
  const paymentMethod = (formData.get("paymentMethod") as string) || "cash";
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  let items: unknown;
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    redirect(`/caisse?error=${encodeURIComponent("Panier invalide.")}`);
    return;
  }

  const supabase = createClient();
  const { data: order, error } = await supabase
    .rpc("create_pos_order", {
      p_store_id: store.id,
      p_items: items,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone,
      p_payment_method: paymentMethod,
      p_notes: notes,
    })
    .single<PosOrderResult>();

  if (error || !order) {
    redirect(
      `/caisse?error=${encodeURIComponent(error?.message ?? "Impossible d'enregistrer la vente.")}`
    );
    return;
  }

  redirect(`/caisse/${order.id}`);
}
