"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

function readAutomationFields(formData: FormData) {
  const triggerType = formData.get("triggerType") as string;
  const daysInput = formData.get("days") as string;

  return {
    name: formData.get("name") as string,
    trigger_type: triggerType,
    trigger_config: triggerType === "customer_inactive" ? { days: Number(daysInput || 60) } : {},
    action_title: formData.get("actionTitle") as string,
    action_message: formData.get("actionMessage") as string,
    is_active: formData.get("isActive") === "on",
  };
}

export async function createAutomation(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase
    .from("automations")
    .insert({ organization_id: store.organization_id, ...readAutomationFields(formData) });

  if (error) {
    redirect(`/automatisations/nouvelle?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/automatisations");
  redirect("/automatisations");
}

export async function updateAutomation(formData: FormData) {
  const automationId = formData.get("automationId") as string;
  const supabase = createClient();
  const { error } = await supabase
    .from("automations")
    .update(readAutomationFields(formData))
    .eq("id", automationId);

  if (error) {
    redirect(`/automatisations/${automationId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/automatisations");
  redirect(`/automatisations/${automationId}?success=1`);
}

export async function deleteAutomation(formData: FormData) {
  const automationId = formData.get("automationId") as string;
  const supabase = createClient();
  const { error } = await supabase.from("automations").delete().eq("id", automationId);

  if (error) {
    redirect(`/automatisations/${automationId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/automatisations");
  redirect("/automatisations");
}

export async function runInactivityCheck(formData: FormData) {
  const automationId = formData.get("automationId") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { data, error } = await supabase.rpc("run_customer_inactivity_check", {
    p_organization_id: store.organization_id,
  });

  if (error) {
    redirect(`/automatisations/${automationId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/automatisations/${automationId}`);
  redirect(`/automatisations/${automationId}?checked=${data ?? 0}`);
}
