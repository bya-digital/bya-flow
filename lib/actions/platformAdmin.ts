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
