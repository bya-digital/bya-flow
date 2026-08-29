"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

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
