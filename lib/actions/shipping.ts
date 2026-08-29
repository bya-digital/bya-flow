"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

function readShippingFields(formData: FormData) {
  const freeAbove = formData.get("freeAbove") as string;

  return {
    name: (formData.get("name") as string).trim(),
    description: (formData.get("description") as string) || null,
    price: Math.max(Number(formData.get("price") || 0), 0),
    free_above: freeAbove ? Math.max(Number(freeAbove), 0) : null,
    is_active: formData.get("isActive") === "on",
  };
}

export async function createShippingMethod(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase
    .from("shipping_methods")
    .insert({ store_id: store.id, ...readShippingFields(formData) });

  if (error) {
    redirect(`/livraison/nouveau?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/livraison");
  redirect("/livraison");
}

export async function updateShippingMethod(formData: FormData) {
  const methodId = formData.get("methodId") as string;
  const supabase = createClient();
  const { error } = await supabase
    .from("shipping_methods")
    .update(readShippingFields(formData))
    .eq("id", methodId);

  if (error) {
    redirect(`/livraison/${methodId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/livraison");
  redirect("/livraison?success=1");
}

export async function deleteShippingMethod(formData: FormData) {
  const methodId = formData.get("methodId") as string;
  const supabase = createClient();
  const { error } = await supabase.from("shipping_methods").delete().eq("id", methodId);

  if (error) {
    redirect(`/livraison?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/livraison");
  redirect("/livraison");
}
