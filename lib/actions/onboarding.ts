"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const companyName = formData.get("companyName") as string;
  const businessType = formData.get("businessType") as string;
  const currency = formData.get("currency") as string;
  const country = formData.get("country") as string;
  const primaryGoal = formData.get("primaryGoal") as string;
  const storeName = (formData.get("storeName") as string) || companyName;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organization, error: orgError } = await supabase
    .rpc("create_organization_with_owner", {
      p_name: companyName,
      p_business_type: businessType,
      p_currency: currency,
      p_country: country,
      p_primary_goal: primaryGoal,
    })
    .single<{ id: string }>();

  if (orgError || !organization) {
    redirect(
      `/onboarding?error=${encodeURIComponent(
        orgError?.message ?? "Impossible de créer l'organisation."
      )}`
    );
    return;
  }

  const { error: storeError } = await supabase.from("stores").insert({
    organization_id: organization.id,
    name: storeName,
    currency,
    country,
  });

  if (storeError) {
    redirect(`/onboarding?error=${encodeURIComponent(storeError.message)}`);
  }

  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);

  redirect("/dashboard");
}
