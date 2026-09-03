"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

// Accepte "maboutique.com", "www.maboutique.com" ou une URL complète
// collée par erreur ; ne garde que le nom d'hôte.
function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const hostname = new URL(withProtocol).hostname;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) return null;
    return hostname;
  } catch {
    return null;
  }
}

export async function updateCustomDomain(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const raw = (formData.get("domain") as string) || "";
  const domain = normalizeDomain(raw);

  if (!domain) {
    redirect(`/boutique/domaine?error=${encodeURIComponent("Domaine invalide.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("stores")
    // Un changement de domaine repart en attente de vérification : BYA
    // Digital doit le rattacher au projet Vercel avant qu'il serve quoi
    // que ce soit, même si l'ancien domaine était déjà vérifié.
    .update({ custom_domain: domain, custom_domain_verified_at: null })
    .eq("id", store.id);

  if (error) {
    const message =
      error.code === "23505"
        ? "Ce domaine est déjà utilisé par une autre boutique."
        : error.message;
    redirect(`/boutique/domaine?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/boutique/domaine");
  redirect("/boutique/domaine?success=1");
}

export async function removeCustomDomain() {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  await supabase
    .from("stores")
    .update({ custom_domain: null, custom_domain_verified_at: null })
    .eq("id", store.id);

  revalidatePath("/boutique/domaine");
  redirect("/boutique/domaine");
}
