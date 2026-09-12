"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function createAffiliate(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const commissionRateInput = formData.get("commissionRate") as string;
  const commissionRate = Number(commissionRateInput);

  if (!fullName?.trim() || !email?.trim()) {
    redirect(`/affiliation?error=${encodeURIComponent("Nom et email requis.")}`);
    return;
  }
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    redirect(`/affiliation?error=${encodeURIComponent("Taux de commission invalide (0 à 100).")}`);
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("affiliates").insert({
    store_id: store.id,
    full_name: fullName,
    email,
    commission_rate: commissionRate,
  });

  if (error) {
    redirect(`/affiliation?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/affiliation");
  redirect("/affiliation?success=1");
}

export async function toggleAffiliate(formData: FormData) {
  const affiliateId = formData.get("affiliateId") as string;
  const status = formData.get("status") as string;
  const supabase = createClient();

  const { error } = await supabase
    .from("affiliates")
    .update({ status: status === "active" ? "suspended" : "active" })
    .eq("id", affiliateId);

  if (error) {
    redirect(`/affiliation?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/affiliation");
  redirect("/affiliation");
}

export async function deleteAffiliate(formData: FormData) {
  const affiliateId = formData.get("affiliateId") as string;
  const supabase = createClient();

  const { error } = await supabase.from("affiliates").delete().eq("id", affiliateId);

  if (error) {
    redirect(`/affiliation?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/affiliation");
  redirect("/affiliation");
}
