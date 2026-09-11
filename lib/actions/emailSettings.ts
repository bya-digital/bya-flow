"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

// Réservée admin/propriétaire — une clé API Resend est un secret,
// même principe que savePaymentProvider() (Phase 35B). Un champ vide
// conserve la clé déjà enregistrée (jamais renvoyée au navigateur),
// même discipline que PaymentProviderCard.
export async function saveEmailProviderSettings(formData: FormData) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");
  if (membership.role === "member") {
    redirect(
      `/campagnes/parametres?error=${encodeURIComponent(
        "Seuls les administrateurs peuvent configurer l'envoi d'emails."
      )}`
    );
    return;
  }

  const senderEmail = formData.get("senderEmail") as string;
  const senderName = formData.get("senderName") as string;
  const apiKeyInput = (formData.get("resendApiKey") as string) || "";
  const isActive = formData.get("isActive") === "on";

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("email_provider_settings")
    .select("resend_api_key")
    .eq("organization_id", membership.organizationId)
    .maybeSingle<{ resend_api_key: string | null }>();

  const resendApiKey = apiKeyInput.trim() || existing?.resend_api_key || null;

  if (isActive && (!resendApiKey || !senderEmail)) {
    redirect(
      `/campagnes/parametres?error=${encodeURIComponent(
        "Renseignez la clé API et l'adresse d'expédition avant d'activer l'envoi."
      )}`
    );
    return;
  }

  const { error } = await supabase.from("email_provider_settings").upsert(
    {
      organization_id: membership.organizationId,
      resend_api_key: resendApiKey,
      sender_email: senderEmail || null,
      sender_name: senderName || null,
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
