"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface LessonFileRow {
  file_path: string | null;
  file_name: string | null;
}

export interface LessonDownloadResult {
  url: string | null;
  fileName: string | null;
  error?: string;
}

// Même discipline que getDigitalDownloadUrl() (Phase 37) : URL signée
// à durée de vie courte, générée à la demande — jamais mise en cache.
export async function getLessonDownloadUrl(lessonId: string): Promise<LessonDownloadResult> {
  const supabase = createClient();

  const { data: file } = await supabase
    .rpc("get_lesson_file_for_download", { p_lesson_id: lessonId })
    .maybeSingle<LessonFileRow>();

  if (!file?.file_path) {
    return { url: null, fileName: null, error: "Fichier indisponible." };
  }

  const { data: signed, error } = await supabase.storage
    .from("digital-products")
    .createSignedUrl(file.file_path, 300);

  if (error || !signed) {
    return { url: null, fileName: null, error: "Le lien de téléchargement n'a pas pu être généré." };
  }

  return { url: signed.signedUrl, fileName: file.file_name };
}

// mark_lesson_complete() (SQL, SECURITY DEFINER) revérifie elle-même
// que l'appelant a payé cette formation avant d'écrire quoi que ce
// soit — jamais un lessonId de confiance seul.
export async function markLessonComplete(formData: FormData) {
  const lessonId = formData.get("lessonId") as string;
  const storeSlug = formData.get("storeSlug") as string;
  const productId = formData.get("productId") as string;

  const supabase = createClient();
  await supabase.rpc("mark_lesson_complete", { p_lesson_id: lessonId });

  revalidatePath(`/store/${storeSlug}/compte/formations/${productId}`);
}
