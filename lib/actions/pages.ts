"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Block } from "@/lib/pageBuilder/types";

export async function createPage(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const title = formData.get("title") as string;
  const slug = slugify((formData.get("slug") as string) || title);
  const supabase = createClient();

  const { data: page, error } = await supabase
    .from("store_pages")
    .insert({ store_id: store.id, title, slug })
    .select("id")
    .single<{ id: string }>();

  if (error || !page) {
    redirect(
      `/pages-de-vente?error=${encodeURIComponent(error?.message ?? "Erreur lors de la création.")}`
    );
    return;
  }

  revalidatePath("/pages-de-vente");
  redirect(`/pages-de-vente/${page.id}`);
}

export async function deletePage(formData: FormData) {
  const pageId = formData.get("pageId") as string;
  const supabase = createClient();

  const { error } = await supabase.from("store_pages").delete().eq("id", pageId);

  if (error) {
    redirect(`/pages-de-vente?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/pages-de-vente");
  redirect("/pages-de-vente");
}

export async function updatePageMeta(formData: FormData) {
  const pageId = formData.get("pageId") as string;
  const title = formData.get("title") as string;
  const slug = slugify((formData.get("slug") as string) || title);
  const supabase = createClient();

  const { error } = await supabase.from("store_pages").update({ title, slug }).eq("id", pageId);

  if (error) {
    redirect(`/pages-de-vente/${pageId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/pages-de-vente/${pageId}`);
  redirect(`/pages-de-vente/${pageId}?success=1`);
}

// Les blocs sont édités entièrement côté client (ordre, contenu,
// ajout/suppression) puis envoyés en un seul JSON à l'enregistrement —
// plus simple et plus fiable qu'une écriture bloc par bloc pour une
// structure qui n'est qu'un tableau ordonné.
export async function savePageBlocks(pageId: string, blocks: Block[]) {
  const supabase = createClient();
  const { error } = await supabase.from("store_pages").update({ blocks }).eq("id", pageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/pages-de-vente/${pageId}`);
}

export async function setPageStatus(formData: FormData) {
  const pageId = formData.get("pageId") as string;
  const status = formData.get("status") as string;
  const supabase = createClient();

  const { error } = await supabase
    .from("store_pages")
    .update({ status: status === "published" ? "published" : "draft" })
    .eq("id", pageId);

  if (error) {
    redirect(`/pages-de-vente/${pageId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/pages-de-vente/${pageId}`);
  redirect(`/pages-de-vente/${pageId}`);
}

// Bloc "formulaire" côté boutique publique — jamais une écriture
// directe, capture_page_lead() (SECURITY DEFINER) revérifie elle-même
// que la page existe et est publiée.
export async function capturePageLead(formData: FormData) {
  const pageId = formData.get("pageId") as string;
  const email = formData.get("email") as string;
  const fullName = (formData.get("fullName") as string) || null;
  const storeSlug = formData.get("storeSlug") as string;
  const pageSlug = formData.get("pageSlug") as string;

  const supabase = createClient();
  await supabase.rpc("capture_page_lead", { p_page_id: pageId, p_email: email, p_full_name: fullName });

  redirect(`/store/${storeSlug}/pages/${pageSlug}?success=1`);
}
