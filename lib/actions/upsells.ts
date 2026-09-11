"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function createUpsellOffer(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const triggerProductId = formData.get("triggerProductId") as string;
  const upsellProductId = formData.get("upsellProductId") as string;
  const downsellProductId = (formData.get("downsellProductId") as string) || null;
  const upsellHeadline = (formData.get("upsellHeadline") as string) || null;
  const downsellHeadline = (formData.get("downsellHeadline") as string) || null;

  if (!triggerProductId || !upsellProductId) {
    redirect(`/upsells?error=${encodeURIComponent("Choisissez au moins le produit déclencheur et l'upsell.")}`);
    return;
  }
  if (triggerProductId === upsellProductId) {
    redirect(
      `/upsells?error=${encodeURIComponent("Le produit déclencheur et l'upsell doivent être différents.")}`
    );
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("upsell_offers").insert({
    store_id: store.id,
    trigger_product_id: triggerProductId,
    upsell_product_id: upsellProductId,
    downsell_product_id: downsellProductId,
    upsell_headline: upsellHeadline,
    downsell_headline: downsellHeadline,
  });

  if (error) {
    redirect(`/upsells?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/upsells");
  redirect("/upsells?success=1");
}

export async function deleteUpsellOffer(formData: FormData) {
  const offerId = formData.get("offerId") as string;
  const supabase = createClient();

  const { error } = await supabase.from("upsell_offers").delete().eq("id", offerId);

  if (error) {
    redirect(`/upsells?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/upsells");
  redirect("/upsells");
}

export async function toggleUpsellOffer(formData: FormData) {
  const offerId = formData.get("offerId") as string;
  const isActive = formData.get("isActive") === "true";
  const supabase = createClient();

  const { error } = await supabase
    .from("upsell_offers")
    .update({ is_active: !isActive })
    .eq("id", offerId);

  if (error) {
    redirect(`/upsells?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/upsells");
  redirect("/upsells");
}
