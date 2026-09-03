"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isPlatformAdmin } from "@/lib/data/platformAdmin";
import { createClient } from "@/lib/supabase/server";

export async function updateOrganizationPlan(formData: FormData) {
  const authorized = await isPlatformAdmin();
  if (!authorized) redirect("/dashboard");

  const organizationId = formData.get("organizationId") as string;
  const plan = formData.get("plan") as string;

  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ plan })
    .eq("organization_id", organizationId);

  if (error) {
    redirect(`/admin-plateforme?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin-plateforme");
  redirect("/admin-plateforme?success=1");
}

// À utiliser une fois le domaine effectivement rattaché à la main au
// projet Vercel (Domains → Add) — cette action ne fait que le
// consigner côté app, elle n'appelle aucune API Vercel.
export async function verifyCustomDomain(formData: FormData) {
  const authorized = await isPlatformAdmin();
  if (!authorized) redirect("/dashboard");

  const storeId = formData.get("storeId") as string;

  const supabase = createClient();
  const { error } = await supabase
    .from("stores")
    .update({ custom_domain_verified_at: new Date().toISOString() })
    .eq("id", storeId);

  if (error) {
    redirect(`/admin-plateforme?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin-plateforme");
  redirect("/admin-plateforme?success=domain");
}
