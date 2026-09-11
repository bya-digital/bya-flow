"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlan } from "@/lib/billing/plans";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

// Le client applique déjà min="0" sur ces champs, mais une requête forgée
// pourrait contourner cette contrainte HTML : on la revalide donc côté
// serveur, seule limite qui compte réellement.
function toNonNegativeNumber(value: FormDataEntryValue | null): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function readProductFields(formData: FormData) {
  const name = formData.get("name") as string;
  const slugInput = (formData.get("slug") as string) || name;
  const compareAtPrice = formData.get("compareAtPrice");
  const weight = formData.get("weight");
  const productTypeInput = formData.get("productType");
  const productType =
    productTypeInput === "digital" || productTypeInput === "course" ? productTypeInput : "physical";
  const hasUnlimitedStock = productType !== "physical";
  return {
    name,
    slug: slugify(slugInput),
    description: (formData.get("description") as string) || null,
    price: toNonNegativeNumber(formData.get("price")),
    compare_at_price: compareAtPrice ? toNonNegativeNumber(compareAtPrice) : null,
    sku: (formData.get("sku") as string) || null,
    // Stock/poids n'ont pas de sens pour un produit numérique ou une
    // formation (quantité illimitée par nature). checkout_cart()/
    // create_pos_order() ignorent déjà le stock hors product_type =
    // 'physical' (jamais décrémenté, jamais bloquant) — ce grand nombre
    // n'a donc qu'un rôle cosmétique : il évite de casser l'affichage
    // "en stock"/quantité max du storefront, qui lit stock comme un
    // inventaire réel un peu partout.
    stock: hasUnlimitedStock ? 999999 : Math.round(toNonNegativeNumber(formData.get("stock"))),
    weight: hasUnlimitedStock ? null : weight ? toNonNegativeNumber(weight) : null,
    status: (formData.get("status") as string) || "draft",
    category_id: (formData.get("categoryId") as string) || null,
    product_type: productType,
  };
}

export async function createProduct(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();

  const [{ count: productCount }, { data: subscription }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("organization_id", store.organization_id)
      .maybeSingle(),
  ]);

  const plan = getPlan(subscription?.plan);

  if ((productCount ?? 0) >= plan.maxProducts) {
    redirect(
      `/produits/nouveau?error=${encodeURIComponent(
        `Limite de ${plan.maxProducts} produits atteinte pour le plan ${plan.name}. Passez à un plan supérieur pour en ajouter davantage.`
      )}`
    );
    return;
  }

  const fields = readProductFields(formData);
  // Ni un fichier numérique ni un module/leçon de formation ne peuvent
  // encore exister à la création (ça se gère après, sur la fiche
  // produit) — jamais publier "Actif" sans rien à livrer (Règle 34 :
  // pas de fonctionnalité présentée comme opérationnelle sans l'être
  // réellement).
  const forcedToDraft =
    (fields.product_type === "digital" || fields.product_type === "course") &&
    fields.status === "active";
  if (forcedToDraft) {
    fields.status = "draft";
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({ store_id: store.id, ...fields })
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
  redirect(
    forcedToDraft
      ? `/produits/${product.id}?message=${encodeURIComponent(
          fields.product_type === "course"
            ? "Enregistré en brouillon : ajoutez au moins un module et une leçon avant d'activer cette formation."
            : "Enregistré en brouillon : ajoutez le fichier numérique avant d'activer ce produit."
        )}`
      : `/produits/${product.id}`
  );
}

export async function updateProduct(formData: FormData) {
  const productId = formData.get("productId") as string;
  const supabase = createClient();
  const fields = readProductFields(formData);

  if (fields.product_type === "digital" && fields.status === "active") {
    const { data: existing } = await supabase
      .from("products")
      .select("digital_file_path")
      .eq("id", productId)
      .maybeSingle<{ digital_file_path: string | null }>();

    if (!existing?.digital_file_path) {
      redirect(
        `/produits/${productId}?error=${encodeURIComponent(
          "Ajoutez le fichier numérique avant d'activer ce produit."
        )}`
      );
      return;
    }
  }

  if (fields.product_type === "course" && fields.status === "active") {
    const { data: lessonCount } = await supabase.rpc("count_course_lessons", {
      p_product_id: productId,
    });

    if (!lessonCount) {
      redirect(
        `/produits/${productId}?error=${encodeURIComponent(
          "Ajoutez au moins un module et une leçon avant d'activer cette formation."
        )}`
      );
      return;
    }
  }

  const { error } = await supabase.from("products").update(fields).eq("id", productId);

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
  const file = formData.get("image") as File;

  if (!file || file.size === 0) {
    redirect(`/produits/${productId}?error=${encodeURIComponent("Aucun fichier sélectionné.")}`);
  }

  const supabase = createClient();

  // Le store_id du chemin de stockage est dérivé du produit lui-même,
  // jamais d'un champ caché envoyé par le client (défense en profondeur :
  // évite qu'un chemin de stockage forgé ne pointe vers une autre boutique).
  const { data: product } = await supabase
    .from("products")
    .select("store_id")
    .eq("id", productId)
    .maybeSingle<{ store_id: string }>();

  if (!product) {
    redirect(`/produits/${productId}?error=${encodeURIComponent("Produit introuvable.")}`);
    return;
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${product.store_id}/${productId}/${Date.now()}.${extension}`;

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

// Un seul fichier par produit numérique (contrairement aux images,
// pas une liste) : l'upload REMPLACE toujours l'éventuel fichier
// précédent, y compris en storage — jamais un fichier orphelin qui
// traîne. Bucket privé (jamais getPublicUrl) : seul un chemin est
// gardé en base, la lecture réelle passe par une URL signée générée
// à la demande (lib/actions/digitalDownload.ts).
export async function uploadDigitalFile(formData: FormData) {
  const productId = formData.get("productId") as string;
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    redirect(`/produits/${productId}?error=${encodeURIComponent("Aucun fichier sélectionné.")}`);
    return;
  }

  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("store_id, digital_file_path")
    .eq("id", productId)
    .maybeSingle<{ store_id: string; digital_file_path: string | null }>();

  if (!product) {
    redirect(`/produits/${productId}?error=${encodeURIComponent("Produit introuvable.")}`);
    return;
  }

  if (product.digital_file_path) {
    await supabase.storage.from("digital-products").remove([product.digital_file_path]);
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : null;
  const path = `${product.store_id}/${productId}/${Date.now()}${extension ? `.${extension}` : ""}`;

  const { error: uploadError } = await supabase.storage
    .from("digital-products")
    .upload(path, file);

  if (uploadError) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(uploadError.message)}`);
    return;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      digital_file_path: path,
      digital_file_name: file.name,
      digital_file_size: file.size,
    })
    .eq("id", productId);

  if (updateError) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(updateError.message)}`);
    return;
  }

  revalidatePath(`/produits/${productId}`);
  redirect(`/produits/${productId}`);
}

export async function deleteDigitalFile(formData: FormData) {
  const productId = formData.get("productId") as string;
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("digital_file_path, status")
    .eq("id", productId)
    .maybeSingle<{ digital_file_path: string | null; status: string }>();

  if (product?.digital_file_path) {
    const { error: storageError } = await supabase.storage
      .from("digital-products")
      .remove([product.digital_file_path]);
    if (storageError) {
      redirect(`/produits/${productId}?error=${encodeURIComponent(storageError.message)}`);
      return;
    }
  }

  // Un produit numérique actif sans fichier serait vendable sans rien à
  // livrer (Règle 34) — repasse automatiquement en brouillon.
  const { error } = await supabase
    .from("products")
    .update({
      digital_file_path: null,
      digital_file_name: null,
      digital_file_size: null,
      ...(product?.status === "active" ? { status: "draft" } : {}),
    })
    .eq("id", productId);

  if (error) {
    redirect(`/produits/${productId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/produits/${productId}`);
  redirect(
    product?.status === "active"
      ? `/produits/${productId}?message=${encodeURIComponent(
          "Produit repassé en brouillon : plus rien à livrer sans fichier."
        )}`
      : `/produits/${productId}`
  );
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
