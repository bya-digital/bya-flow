"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPaymentProvider } from "@/lib/payments";
import type { PaymentConfig, PaymentProviderId } from "@/lib/payments/types";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function savePaymentProvider(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const providerId = formData.get("providerId") as PaymentProviderId;
  const provider = getPaymentProvider(providerId);
  if (!provider) {
    redirect(`/paiements?error=${encodeURIComponent("Fournisseur inconnu.")}`);
    return;
  }

  const wantsActive = formData.get("isActive") === "on";
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("payment_providers")
    .select("config")
    .eq("store_id", store.id)
    .eq("provider", providerId)
    .maybeSingle<{ config: PaymentConfig }>();

  // Un champ laissé vide conserve la valeur déjà enregistrée : les clés
  // API ne sont jamais renvoyées au navigateur une fois sauvegardées
  // (voir PaymentProviderCard), donc un champ vide ne doit pas écraser
  // un secret déjà configuré.
  const mergedConfig: PaymentConfig = { ...(existing?.config ?? {}) };
  for (const field of provider.fields) {
    const value = (formData.get(field.key) as string) || "";
    if (value.trim()) {
      mergedConfig[field.key] = value.trim();
    }
  }

  if (wantsActive && !provider.isConfigured(mergedConfig)) {
    redirect(
      `/paiements?error=${encodeURIComponent(
        `Renseignez tous les champs de ${provider.name} avant de l'activer.`
      )}`
    );
    return;
  }

  const { error } = await supabase.from("payment_providers").upsert(
    {
      store_id: store.id,
      provider: providerId,
      config: mergedConfig,
      is_active: wantsActive,
    },
    { onConflict: "store_id,provider" }
  );

  if (error) {
    redirect(`/paiements?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/paiements");
  redirect("/paiements?success=1");
}
