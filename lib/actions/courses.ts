"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createModule(formData: FormData) {
  const productId = formData.get("productId") as string;
  const title = formData.get("title") as string;
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("course_modules")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase
    .from("course_modules")
    .insert({ product_id: productId, title, position: nextPosition });

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}

export async function deleteModule(formData: FormData) {
  const moduleId = formData.get("moduleId") as string;
  const productId = formData.get("productId") as string;
  const supabase = createClient();

  const { error } = await supabase.from("course_modules").delete().eq("id", moduleId);

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}

export async function createLesson(formData: FormData) {
  const moduleId = formData.get("moduleId") as string;
  const productId = formData.get("productId") as string;
  const title = formData.get("title") as string;
  const videoUrl = (formData.get("videoUrl") as string) || null;
  const content = (formData.get("content") as string) || null;
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("course_lessons")
    .select("position")
    .eq("module_id", moduleId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from("course_lessons").insert({
    module_id: moduleId,
    title,
    video_url: videoUrl,
    content,
    position: nextPosition,
  });

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}

export async function deleteLesson(formData: FormData) {
  const lessonId = formData.get("lessonId") as string;
  const productId = formData.get("productId") as string;
  const supabase = createClient();

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("file_path")
    .eq("id", lessonId)
    .maybeSingle<{ file_path: string | null }>();

  if (lesson?.file_path) {
    await supabase.storage.from("digital-products").remove([lesson.file_path]);
  }

  const { error } = await supabase.from("course_lessons").delete().eq("id", lessonId);

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}

// Support de leçon (PDF, slides...) — réutilise le bucket privé
// digital-products de la Phase 37 avec la même convention de chemin
// (${storeId}/${productId}/...), donc les policies RLS déjà en place
// (gestion équipe + lecture acheteur payé) couvrent aussi ces fichiers
// sans rien ajouter côté storage.
export async function uploadLessonFile(formData: FormData) {
  const lessonId = formData.get("lessonId") as string;
  const productId = formData.get("productId") as string;
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    redirect(`/produits/${productId}?error=${encodeURIComponent("Aucun fichier sélectionné.")}`);
    return;
  }

  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("store_id")
    .eq("id", productId)
    .maybeSingle<{ store_id: string }>();

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("file_path")
    .eq("id", lessonId)
    .maybeSingle<{ file_path: string | null }>();

  if (!product || !lesson) {
    redirect(`/produits/${productId}?error=${encodeURIComponent("Introuvable.")}`);
    return;
  }

  if (lesson.file_path) {
    await supabase.storage.from("digital-products").remove([lesson.file_path]);
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : null;
  const path = `${product.store_id}/${productId}/lessons/${lessonId}-${Date.now()}${
    extension ? `.${extension}` : ""
  }`;

  const { error: uploadError } = await supabase.storage
    .from("digital-products")
    .upload(path, file);

  if (uploadError) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(uploadError.message)}`);
    return;
  }

  const { error: updateError } = await supabase
    .from("course_lessons")
    .update({ file_path: path, file_name: file.name })
    .eq("id", lessonId);

  if (updateError) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(updateError.message)}`);
    return;
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}
