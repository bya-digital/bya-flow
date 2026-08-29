"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

function readCampaignFields(formData: FormData) {
  const tagsInput = (formData.get("audienceTags") as string) || "";
  const scheduledAt = formData.get("scheduledAt") as string;
  return {
    name: formData.get("name") as string,
    subject: (formData.get("subject") as string) || null,
    content: (formData.get("content") as string) || null,
    channel: (formData.get("channel") as string) || "email",
    audience_tags: tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    audience_status: (formData.get("audienceStatus") as string) || null,
    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
  };
}

export async function createCampaign(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({ organization_id: store.organization_id, ...readCampaignFields(formData) })
    .select("id")
    .single<{ id: string }>();

  if (error || !campaign) {
    redirect(
      `/campagnes/nouvelle?error=${encodeURIComponent(
        error?.message ?? "Erreur lors de la création."
      )}`
    );
    return;
  }

  revalidatePath("/campagnes");
  redirect(`/campagnes/${campaign.id}`);
}

export async function updateCampaign(formData: FormData) {
  const campaignId = formData.get("campaignId") as string;
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .update(readCampaignFields(formData))
    .eq("id", campaignId);

  if (error) {
    redirect(`/campagnes/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/campagnes");
  revalidatePath(`/campagnes/${campaignId}`);
  redirect(`/campagnes/${campaignId}?success=1`);
}

export async function deleteCampaign(formData: FormData) {
  const campaignId = formData.get("campaignId") as string;
  const supabase = createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);

  if (error) {
    redirect(`/campagnes/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/campagnes");
  redirect("/campagnes");
}

export async function sendCampaign(formData: FormData) {
  const campaignId = formData.get("campaignId") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("audience_tags, audience_status")
    .eq("id", campaignId)
    .maybeSingle<{ audience_tags: string[]; audience_status: string | null }>();

  if (!campaign) {
    redirect(`/campagnes?error=${encodeURIComponent("Campagne introuvable.")}`);
    return;
  }

  let customerQuery = supabase
    .from("customers")
    .select("id")
    .eq("organization_id", store.organization_id);

  if (campaign.audience_tags.length > 0) {
    customerQuery = customerQuery.overlaps("tags", campaign.audience_tags);
  } else if (campaign.audience_status) {
    customerQuery = customerQuery.eq("status", campaign.audience_status);
  }

  const { data: customers } = await customerQuery;

  if (customers && customers.length > 0) {
    const { error: recipientsError } = await supabase.from("campaign_recipients").insert(
      customers.map((customer) => ({
        campaign_id: campaignId,
        customer_id: customer.id,
      }))
    );

    if (recipientsError) {
      redirect(`/campagnes/${campaignId}?error=${encodeURIComponent(recipientsError.message)}`);
      return;
    }
  }

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", campaignId);

  if (error) {
    redirect(`/campagnes/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/campagnes");
  revalidatePath(`/campagnes/${campaignId}`);
  redirect(`/campagnes/${campaignId}?sent=1`);
}
