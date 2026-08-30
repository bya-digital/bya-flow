"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function updateLoyaltySettings(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const enabled = formData.get("loyaltyEnabled") === "on";
  const earnRate = Math.max(Number(formData.get("earnRate") || 0), 0);
  const redeemValue = Math.max(Number(formData.get("redeemValue") || 0), 0);
  const referralEnabled = formData.get("referralEnabled") === "on";
  const referralBonusPoints = Math.max(Math.round(Number(formData.get("referralBonusPoints") || 0)), 0);
  const referralWelcomePoints = Math.max(
    Math.round(Number(formData.get("referralWelcomePoints") || 0)),
    0
  );

  const supabase = createClient();
  const { error } = await supabase
    .from("stores")
    .update({
      loyalty_enabled: enabled,
      loyalty_earn_rate: earnRate,
      loyalty_redeem_value: redeemValue,
      referral_enabled: referralEnabled,
      referral_bonus_points: referralBonusPoints,
      referral_welcome_points: referralWelcomePoints,
    })
    .eq("id", store.id);

  if (error) {
    redirect(`/fidelite?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/fidelite");
  redirect("/fidelite?success=1");
}
