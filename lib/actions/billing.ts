"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function changePlan(formData: FormData) {
  const plan = formData.get("plan") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ plan })
    .eq("organization_id", store.organization_id);

  if (error) {
    redirect(`/facturation?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/facturation");
  redirect("/facturation?success=1");
}
