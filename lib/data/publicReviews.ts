import { createClient } from "@/lib/supabase/server";

export interface PublicReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  merchantReply: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  reviews: PublicReview[];
}

export async function getPublicReviews(productId: string): Promise<ReviewSummary> {
  const supabase = createClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("id, customer_name, rating, comment, merchant_reply, created_at")
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  const reviews: PublicReview[] = (data ?? []).map((row) => ({
    id: row.id,
    customerName: row.customer_name || "Client",
    rating: row.rating,
    comment: row.comment,
    merchantReply: row.merchant_reply,
    createdAt: row.created_at,
  }));

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return { average, count: reviews.length, reviews };
}

export interface MyReviewEligibility {
  hasPurchased: boolean;
  existingReview: { rating: number; comment: string | null } | null;
}

export async function getMyReviewEligibility(
  productId: string,
  customerEmail: string | null
): Promise<MyReviewEligibility> {
  if (!customerEmail) return { hasPurchased: false, existingReview: null };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("product_reviews")
    .select("rating, comment")
    .eq("product_id", productId)
    .eq("customer_email", customerEmail)
    .maybeSingle<{ rating: number; comment: string | null }>();

  if (existing) {
    return { hasPurchased: true, existingReview: existing };
  }

  // Vérifie l'achat via les commandes visibles par ce client (RLS
  // orders_select_own_account) — évidence suffisante côté lecture ; la
  // vérification faisant foi reste celle de submit_review() côté serveur.
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, order_items(product_id)")
    .neq("status", "cancelled");

  const hasPurchased = (orders ?? []).some((order) =>
    (order.order_items as { product_id: string }[] | null)?.some(
      (item) => item.product_id === productId
    )
  );

  return { hasPurchased, existingReview: null };
}
