"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function readProductFields(formData: FormData) {
  const name = formData.get("name") as string;
  const slugInput = (formData.get("slug") as string) || name;
  return {
    name,
    slug: slugify(slugInput),
    description: (formData.get("description") as string) || null,
    price: Number(formData.get("price") || 0),
    compare_at_price: formData.get("compareAtPrice")
      ? Number(formData.get("compareAtPrice"))
      : null,
    sku: (formData.get("sku") as string) || null,
    stock: Number(formData.get("stock") || 0),
    weight: formData.get("weight") ? Number(formData.get("weight")) : null,
    status: (formData.get("status") as string) || "draft",
    category_id: (formData.get("categoryId") as string) || null,
  };
}

export async function createProduct(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({ store_id: store.id, ...readProductFields(formData) })
    .select("id")
    .single<{ id: string }>();

  if (error || !product) {
    redirect(
      `/produits/nouveau?error=${encodeURIComponent(
        error?.message ?? "Erreur lors de la création."
      )}`
    );
    return;
  }

  revalidatePath("/produits");
  redirect(`/produits/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  const productId = formData.get("productId") as string;
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update(readProductFields(formData))
    .eq("id", productId);

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/produits");
  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}?success=1`);
}

export async function deleteProduct(formData: FormData) {
  const productId = formData.get("productId") as string;
  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/produits");
  redirect("/produits");
}

export async function createCategory(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const name = formData.get("name") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/produits";

  const supabase = createClient();
  const { error } = await supabase.from("product_categories").insert({
    store_id: store.id,
    name,
    slug: slugify(name),
  });

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function uploadProductImage(formData: FormData) {
  const productId = formData.get("productId") as string;
  const storeId = formData.get("storeId") as string;
  const file = formData.get("image") as File;

  if (!file || file.size === 0) {
    redirect(`/produits/${productId}?error=${encodeURIComponent("Aucun fichier sélectionné.")}`);
  }

  const supabase = createClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${storeId}/${productId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);

  if (uploadError) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(path);

  const { data: existingImages } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition =
    existingImages && existingImages.length > 0 ? existingImages[0].position + 1 : 0;

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    url: publicUrlData.publicUrl,
    position: nextPosition,
  });

  if (insertError) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}

export async function deleteProductImage(formData: FormData) {
  const imageId = formData.get("imageId") as string;
  const productId = formData.get("productId") as string;
  const imageUrl = formData.get("imageUrl") as string;

  const supabase = createClient();

  // L'URL publique encode le chemin de stockage ; on le retrouve pour
  // supprimer le fichier en plus de la ligne en base.
  const marker = "/object/public/product-images/";
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex !== -1) {
    const path = imageUrl.slice(markerIndex + marker.length);
    const { error: storageError } = await supabase.storage.from("product-images").remove([path]);
    if (storageError) {
      redirect(`/produits/${productId}?error=${encodeURIComponent(storageError.message)}`);
    }
  }

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}

interface VariantInput {
  name: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
}

export async function saveVariants(formData: FormData) {
  const productId = formData.get("productId") as string;
  const variants = JSON.parse((formData.get("variants") as string) || "[]") as VariantInput[];

  const supabase = createClient();

  const { error: deleteError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(deleteError.message)}`);
  }

  const rows = variants
    .filter((variant) => variant.name.trim().length > 0)
    .map((variant) => ({
      product_id: productId,
      name: variant.name,
      price: variant.price ? Number(variant.price) : null,
      compare_at_price: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      sku: variant.sku || null,
      stock: Number(variant.stock || 0),
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("product_variants").insert(rows);
    if (insertError) {
      redirect(`/produits/${productId}?error=${encodeURIComponent(insertError.message)}`);
    }
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}?success=1`);
}
