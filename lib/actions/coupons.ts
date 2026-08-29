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
  const type = (formData.get("type") as string) || "percentage";

  // Revalidé côté serveur : un pourcentage > 100 n'a pas de sens (le total
  // resterait positif grâce au plafonnement dans createOrder, mais autant
  // ne pas laisser exister un coupon absurde à afficher).
  const rawValue = Number(formData.get("value") || 0);
  const value = type === "percentage" ? Math.min(Math.max(rawValue, 0), 100) : Math.max(rawValue, 0);

  return {
    code: (formData.get("code") as string).trim().toUpperCase(),
    type,
    value,
    min_order_amount: minOrderAmount ? Math.max(Number(minOrderAmount), 0) : null,
    usage_limit: usageLimit ? Math.max(Math.round(Number(usageLimit)), 1) : null,
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
