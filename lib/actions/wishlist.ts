"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleWishlist(formData: FormData) {
  const storeId = formData.get("storeId") as string;
  const storeSlug = formData.get("storeSlug") as string;
  const productId = formData.get("productId") as string;
  const returnTo = (formData.get("returnTo") as string) || `/store/${storeSlug}`;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(`/store/${storeSlug}/compte/connexion`);
    return;
  }

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("store_id", storeId)
    .eq("customer_email", user.email)
    .eq("product_id", productId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("wishlist_items")
      .insert({ store_id: storeId, customer_email: user.email, product_id: productId });
  }

  revalidatePath(returnTo);
  revalidatePath(`/store/${storeSlug}/compte/favoris`);
  redirect(returnTo);
}
