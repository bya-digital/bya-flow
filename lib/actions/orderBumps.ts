"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function createOrderBump(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const triggerProductId = formData.get("triggerProductId") as string;
  const bumpProductId = formData.get("bumpProductId") as string;
  const headline = (formData.get("headline") as string) || null;
  const description = (formData.get("description") as string) || null;

  if (!triggerProductId || !bumpProductId) {
    redirect(`/order-bumps?error=${encodeURIComponent("Choisissez les deux produits.")}`);
    return;
  }
  if (triggerProductId === bumpProductId) {
    redirect(
      `/order-bumps?error=${encodeURIComponent("Le produit déclencheur et l'offre doivent être différents.")}`
    );
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("order_bumps").insert({
    store_id: store.id,
    trigger_product_id: triggerProductId,
    bump_product_id: bumpProductId,
    headline,
    description,
  });

  if (error) {
    redirect(`/order-bumps?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/order-bumps");
  redirect("/order-bumps?success=1");
}

export async function deleteOrderBump(formData: FormData) {
  const bumpId = formData.get("bumpId") as string;
  const supabase = createClient();

  const { error } = await supabase.from("order_bumps").delete().eq("id", bumpId);

  if (error) {
    redirect(`/order-bumps?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/order-bumps");
  redirect("/order-bumps");
}

export async function toggleOrderBump(formData: FormData) {
  const bumpId = formData.get("bumpId") as string;
  const isActive = formData.get("isActive") === "true";
  const supabase = createClient();

  const { error } = await supabase.from("order_bumps").update({ is_active: !isActive }).eq("id", bumpId);

  if (error) {
    redirect(`/order-bumps?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/order-bumps");
  redirect("/order-bumps");
}
