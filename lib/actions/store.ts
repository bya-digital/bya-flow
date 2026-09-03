"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/data/team";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const CURRENT_STORE_COOKIE = "bya_current_store";
const CURRENT_STORE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Bascule la boutique gérée dans l'espace marchand (Phase 32,
// multi-boutiques). Toujours re-vérifié contre l'organisation du membre
// connecté avant d'écrire le cookie : un identifiant de boutique forgé
// n'a de toute façon aucun effet, getCurrentStore() refait la même
// vérification à chaque lecture.
export async function switchStore(formData: FormData) {
  const storeId = formData.get("storeId") as string;
  const redirectTo = (formData.get("redirect") as string) || "/dashboard";

  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const supabase = createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("organization_id", membership.organizationId)
    .maybeSingle<{ id: string }>();

  if (store) {
    cookies().set(CURRENT_STORE_COOKIE, store.id, {
      path: "/",
      maxAge: CURRENT_STORE_COOKIE_MAX_AGE,
    });
  }

  redirect(redirectTo);
}

export async function createStore(formData: FormData) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const name = ((formData.get("name") as string) || "").trim();
  if (!name) {
    redirect(`/boutique?error=${encodeURIComponent("Nom requis.")}`);
  }

  const currency = (formData.get("currency") as string) || "EUR";
  const country = (formData.get("country") as string) || null;

  const supabase = createClient();
  const { data: newStore, error } = await supabase
    .from("stores")
    .insert({ organization_id: membership.organizationId, name, currency, country })
    .select("id")
    .single<{ id: string }>();

  if (error || !newStore) {
    redirect(`/boutique?error=${encodeURIComponent(error?.message ?? "Création impossible.")}`);
    return;
  }

  // Bascule automatiquement sur la boutique qui vient d'être créée —
  // sinon elle existerait sans qu'on la voie nulle part.
  cookies().set(CURRENT_STORE_COOKIE, newStore.id, {
    path: "/",
    maxAge: CURRENT_STORE_COOKIE_MAX_AGE,
  });

  revalidatePath("/boutique");
  redirect("/dashboard?success=store_created");
}

export async function updateStore(formData: FormData) {
  // La boutique à modifier est dérivée de la session, jamais du champ caché
  // envoyé par le client (défense en profondeur : RLS bloquerait déjà une
  // tentative de modifier la boutique d'une autre organisation, mais autant
  // ne pas dépendre uniquement de RLS pour cette décision).
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");
  const storeId = store.id;

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const country = formData.get("country") as string;
  const slugInput = (formData.get("slug") as string) || name;
  const isActive = formData.get("isActive") === "on";
  const logoFile = formData.get("logo") as File | null;

  const supabase = createClient();

  let logoUrl: string | undefined;

  if (logoFile && logoFile.size > 0) {
    const extension = logoFile.name.split(".").pop() ?? "png";
    const path = `${storeId}/logo-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(path, logoFile, { upsert: true });

    if (uploadError) {
      redirect(`/boutique?error=${encodeURIComponent(uploadError.message)}`);
    }

    const { data: publicUrlData } = supabase.storage.from("store-assets").getPublicUrl(path);
    logoUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name,
      description,
      country,
      slug: slugify(slugInput),
      is_active: isActive,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", storeId);

  if (error) {
    redirect(`/boutique?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/boutique");
  redirect("/boutique?success=1");
}

export async function updateStoreAppearance(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");
  const storeId = store.id;

  const supabase = createClient();

  let heroImageUrl: string | undefined;
  const heroImageFile = formData.get("heroImage") as File | null;

  if (heroImageFile && heroImageFile.size > 0) {
    const extension = heroImageFile.name.split(".").pop() ?? "jpg";
    const path = `${storeId}/hero-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(path, heroImageFile, { upsert: true });

    if (uploadError) {
      redirect(`/boutique/apparence?error=${encodeURIComponent(uploadError.message)}`);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("store-assets").getPublicUrl(path);
    heroImageUrl = publicUrlData.publicUrl;
  }

  const accentColorInput = ((formData.get("accentColor") as string) || "").trim();
  const accentColor = /^#[0-9a-fA-F]{6}$/.test(accentColorInput) ? accentColorInput : null;

  const { error } = await supabase
    .from("stores")
    .update({
      hero_title: (formData.get("heroTitle") as string) || null,
      hero_subtitle: (formData.get("heroSubtitle") as string) || null,
      hero_cta_label: (formData.get("heroCtaLabel") as string) || null,
      accent_color: accentColor,
      social_facebook: (formData.get("socialFacebook") as string) || null,
      social_instagram: (formData.get("socialInstagram") as string) || null,
      social_tiktok: (formData.get("socialTiktok") as string) || null,
      social_whatsapp: (formData.get("socialWhatsapp") as string) || null,
      footer_text: (formData.get("footerText") as string) || null,
      ...(heroImageUrl ? { hero_image_url: heroImageUrl } : {}),
    })
    .eq("id", storeId);

  if (error) {
    redirect(`/boutique/apparence?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/boutique/apparence");
  revalidatePath(`/store/${store.slug}`, "layout");
  redirect("/boutique/apparence?success=1");
}
