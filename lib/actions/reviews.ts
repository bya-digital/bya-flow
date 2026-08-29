"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface SubmitReviewResult {
  id: string;
}

export async function submitReview(formData: FormData) {
  const storeSlug = formData.get("storeSlug") as string;
  const productSlug = formData.get("productSlug") as string;
  const productId = formData.get("productId") as string;
  const rating = Number(formData.get("rating"));
  const comment = (formData.get("comment") as string) || null;
  const productUrl = `/store/${storeSlug}/produits/${productSlug}`;

  const supabase = createClient();
  const { error } = await supabase
    .rpc("submit_review", {
      p_product_id: productId,
      p_rating: rating,
      p_comment: comment,
    })
    .single<SubmitReviewResult>();

  if (error) {
    redirect(`${productUrl}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(productUrl);
  redirect(`${productUrl}?reviewSuccess=1`);
}

export async function updateReviewModeration(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const reviewId = formData.get("reviewId") as string;
  const merchantReply = (formData.get("merchantReply") as string) || null;
  const isVisible = formData.get("isVisible") === "on";

  const supabase = createClient();
  const { error } = await supabase
    .from("product_reviews")
    .update({ merchant_reply: merchantReply, is_visible: isVisible })
    .eq("id", reviewId);

  if (error) {
    redirect(`/avis?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/avis");
  redirect("/avis?success=1");
}
