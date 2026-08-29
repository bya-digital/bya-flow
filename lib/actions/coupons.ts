"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

function readCouponFields(formData: FormData) {
  const startsAt = formData.get("startsAt") as string;
  const endsAt = formData.get("endsAt") as string;
  const usageLimit = formData.get("usageLimit") as string;
  const minOrderAmount = formData.get("minOrderAmount") as string;

  return {
    code: (formData.get("code") as string).trim().toUpperCase(),
    type: (formData.get("type") as string) || "percentage",
    value: Number(formData.get("value") || 0),
    min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
    usage_limit: usageLimit ? Number(usageLimit) : null,
    starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    is_active: formData.get("isActive") === "on",
  };
}

export async function createCoupon(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase
    .from("coupons")
    .insert({ store_id: store.id, ...readCouponFields(formData) });

  if (error) {
    redirect(`/promotions/nouveau?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/promotions");
  redirect("/promotions");
}

export async function updateCoupon(formData: FormData) {
  const couponId = formData.get("couponId") as string;
  const supabase = createClient();
  const { error } = await supabase
    .from("coupons")
    .update(readCouponFields(formData))
    .eq("id", couponId);

  if (error) {
    redirect(`/promotions/${couponId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/promotions");
  redirect("/promotions?success=1");
}

export async function deleteCoupon(formData: FormData) {
  const couponId = formData.get("couponId") as string;
  const supabase = createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", couponId);

  if (error) {
    redirect(`/promotions?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/promotions");
  redirect("/promotions");
}
