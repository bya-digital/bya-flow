"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

// Réservée admin/propriétaire — un Auth Token Twilio est un secret,
// même principe que saveEmailProviderSettings() (Phase 44). Un champ
// vide conserve le token déjà enregistré (jamais renvoyé au
// navigateur).
export async function saveMessagingProviderSettings(formData: FormData) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");
  if (membership.role === "member") {
    redirect(
      `/campagnes/parametres?error=${encodeURIComponent(
        "Seuls les administrateurs peuvent configurer l'envoi de SMS/WhatsApp."
      )}`
    );
    return;
  }

  const accountSid = (formData.get("twilioAccountSid") as string) || "";
  const authTokenInput = (formData.get("twilioAuthToken") as string) || "";
  const smsFrom = formData.get("twilioSmsFrom") as string;
  const whatsappFrom = formData.get("twilioWhatsappFrom") as string;
  const isActive = formData.get("isMessagingActive") === "on";

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("messaging_provider_settings")
    .select("twilio_auth_token")
    .eq("organization_id", membership.organizationId)
    .maybeSingle<{ twilio_auth_token: string | null }>();

  const authToken = authTokenInput.trim() || existing?.twilio_auth_token || null;

  if (isActive && (!accountSid || !authToken || (!smsFrom && !whatsappFrom))) {
    redirect(
      `/campagnes/parametres?error=${encodeURIComponent(
        "Renseignez le SID de compte, le token, et au moins un numéro d'envoi (SMS ou WhatsApp) avant d'activer l'envoi."
      )}`
    );
    return;
  }

  const { error } = await supabase.from("messaging_provider_settings").upsert(
    {
      organization_id: membership.organizationId,
      twilio_account_sid: accountSid || null,
      twilio_auth_token: authToken,
      twilio_sms_from: smsFrom || null,
      twilio_whatsapp_from: whatsappFrom || null,
      is_active: isActive,
    },
    { onConflict: "organization_id" }
  );

  if (error) {
    redirect(`/campagnes/parametres?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/campagnes/parametres");
  redirect("/campagnes/parametres?success=1");
}
