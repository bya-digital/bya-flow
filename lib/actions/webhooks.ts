"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateWebhookSecret } from "@/lib/webhooks";
import { getCurrentMembership } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

export async function createWebhook(formData: FormData) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const url = ((formData.get("url") as string) || "").trim();
  if (!/^https:\/\//.test(url)) {
    redirect(`/developpeurs?error=${encodeURIComponent("L'URL doit commencer par https://.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.from("webhook_endpoints").insert({
    organization_id: membership.organizationId,
    url,
    event: "order.created",
    secret: generateWebhookSecret(),
  });

  if (error) {
    redirect(`/developpeurs?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/developpeurs");
  redirect("/developpeurs?success=webhook");
}

export async function toggleWebhook(formData: FormData) {
  const webhookId = formData.get("webhookId") as string;
  const isActive = formData.get("isActive") === "true";
  const supabase = createClient();
  await supabase.from("webhook_endpoints").update({ is_active: !isActive }).eq("id", webhookId);
  revalidatePath("/developpeurs");
  redirect("/developpeurs");
}

export async function deleteWebhook(formData: FormData) {
  const webhookId = formData.get("webhookId") as string;
  const supabase = createClient();
  await supabase.from("webhook_endpoints").delete().eq("id", webhookId);
  revalidatePath("/developpeurs");
  redirect("/developpeurs");
}
