"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";
import { sendResendBatch } from "@/lib/email/resend";
import { sendTwilioMessages, toWhatsappAddress } from "@/lib/sms/twilio";
import type { CustomerSegment } from "@/lib/data/crm";

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
    audience_segment: (formData.get("audienceSegment") as string) || null,
    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
  };
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => vars[key] ?? match);
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
    .select("subject, content, channel, audience_tags, audience_status, audience_segment")
    .eq("id", campaignId)
    .maybeSingle<{
      subject: string | null;
      content: string | null;
      channel: string;
      audience_tags: string[];
      audience_status: string | null;
      audience_segment: CustomerSegment | null;
    }>();

  if (!campaign) {
    redirect(`/campagnes?error=${encodeURIComponent("Campagne introuvable.")}`);
    return;
  }

  let targetCustomerIds: string[] | null = null;

  if (campaign.audience_segment) {
    const { getCustomerRfmMapByOrg } = await import("@/lib/data/crm");
    const rfmMap = await getCustomerRfmMapByOrg(store.organization_id);
    targetCustomerIds = Array.from(rfmMap.values())
      .filter((r) => r.segment === campaign.audience_segment)
      .map((r) => r.customerId);
  }

  let customerQuery = supabase
    .from("customers")
    .select("id, email, phone")
    .eq("organization_id", store.organization_id);

  if (targetCustomerIds) {
    customerQuery = customerQuery.in("id", targetCustomerIds);
  } else if (campaign.audience_tags.length > 0) {
    customerQuery = customerQuery.overlaps("tags", campaign.audience_tags);
  } else if (campaign.audience_status) {
    customerQuery = customerQuery.eq("status", campaign.audience_status);
  }

  const { data: customers } = await customerQuery.returns<
    { id: string; email: string | null; phone: string | null }[]
  >();

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

  // Envoi réel uniquement si un provider actif existe pour
  // l'organisation, pour le canal de CETTE campagne — jamais de faux
  // "envoyé" sans provider réel (directive Section 18/19).
  let canSendReal = false;

  if (campaign.channel === "email") {
    const { data: providerSettings } = await supabase
      .from("email_provider_settings")
      .select("resend_api_key, sender_email, sender_name, is_active")
      .eq("organization_id", store.organization_id)
      .maybeSingle<{
        resend_api_key: string | null;
        sender_email: string | null;
        sender_name: string | null;
        is_active: boolean;
      }>();

    canSendReal = Boolean(
      providerSettings?.is_active && providerSettings.resend_api_key && providerSettings.sender_email
    );

    if (canSendReal && customers && customers.length > 0) {
      const recipientsWithEmail = customers.filter(
        (c): c is { id: string; email: string; phone: string | null } => Boolean(c.email)
      );
      const from = providerSettings!.sender_name
        ? `${providerSettings!.sender_name} <${providerSettings!.sender_email}>`
        : providerSettings!.sender_email!;

      const results = await sendResendBatch(
        providerSettings!.resend_api_key!,
        recipientsWithEmail.map((c) => ({
          from,
          to: c.email,
          subject: campaign.subject ?? "",
          html: renderTemplate(campaign.content ?? "", { email: c.email }),
        }))
      );

      for (let i = 0; i < recipientsWithEmail.length; i++) {
        const result = results[i];
        await supabase
          .from("campaign_recipients")
          .update({
            status: result?.success ? "sent" : "failed",
            error_message: result?.success ? null : result?.errorMessage ?? "Erreur inconnue.",
            sent_at: result?.success ? new Date().toISOString() : null,
          })
          .eq("campaign_id", campaignId)
          .eq("customer_id", recipientsWithEmail[i].id);
      }
    }
  } else if (campaign.channel === "sms" || campaign.channel === "whatsapp") {
    const { data: messagingSettings } = await supabase
      .from("messaging_provider_settings")
      .select("twilio_account_sid, twilio_auth_token, twilio_sms_from, twilio_whatsapp_from, is_active")
      .eq("organization_id", store.organization_id)
      .maybeSingle<{
        twilio_account_sid: string | null;
        twilio_auth_token: string | null;
        twilio_sms_from: string | null;
        twilio_whatsapp_from: string | null;
        is_active: boolean;
      }>();

    const from =
      campaign.channel === "whatsapp"
        ? messagingSettings?.twilio_whatsapp_from
        : messagingSettings?.twilio_sms_from;

    canSendReal = Boolean(
      messagingSettings?.is_active && messagingSettings.twilio_account_sid && messagingSettings.twilio_auth_token && from
    );

    if (canSendReal && customers && customers.length > 0) {
      const recipientsWithPhone = customers.filter(
        (c): c is { id: string; email: string | null; phone: string } => Boolean(c.phone)
      );

      const results = await sendTwilioMessages(
        messagingSettings!.twilio_account_sid!,
        messagingSettings!.twilio_auth_token!,
        campaign.channel === "whatsapp" ? toWhatsappAddress(from!) : from!,
        recipientsWithPhone.map((c) => ({
          to: campaign.channel === "whatsapp" ? toWhatsappAddress(c.phone) : c.phone,
          body: renderTemplate(campaign.content ?? "", { phone: c.phone }),
        }))
      );

      for (let i = 0; i < recipientsWithPhone.length; i++) {
        const result = results[i];
        await supabase
          .from("campaign_recipients")
          .update({
            status: result?.success ? "sent" : "failed",
            error_message: result?.success ? null : result?.errorMessage ?? "Erreur inconnue.",
            sent_at: result?.success ? new Date().toISOString() : null,
          })
          .eq("campaign_id", campaignId)
          .eq("customer_id", recipientsWithPhone[i].id);
      }
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
  redirect(`/campagnes/${campaignId}?sent=1&real=${canSendReal ? "1" : "0"}`);
}
