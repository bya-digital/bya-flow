import { MessageSquareQuote } from "lucide-react";
import { StarRating } from "@/components/store/StarRating";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateReviewModeration } from "@/lib/actions/reviews";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface ReviewRow {
  id: string;
  customer_name: string | null;
  rating: number;
  comment: string | null;
  merchant_reply: string | null;
  is_visible: boolean;
  products: { name: string } | null;
}

export default async function AvisPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  let reviews: ReviewRow[] = [];
  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("id, customer_name, rating, comment, merchant_reply, is_visible, products!inner(name, store_id)")
      .eq("products.store_id", store.id)
      .order("created_at", { ascending: false });
    reviews = (data ?? []) as unknown as ReviewRow[];
  }

  return (
    <>
      <PageHeader title="Avis clients" description="Modération et réponses aux avis produits." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Avis mis à jour" />
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Aucun avis pour l'instant"
          description="Les avis apparaîtront ici une fois vos clients livrés."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {review.products?.name ?? "Produit"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={review.rating} size={14} />
                    <span className="text-xs text-slate-500">
                      {review.customer_name ?? "Client"}
                    </span>
                  </div>
                </div>
                <Badge tone={review.is_visible ? "success" : "neutral"}>
                  {review.is_visible ? "Visible" : "Masqué"}
                </Badge>
              </div>

              {review.comment && <p className="mt-3 text-sm text-slate-600">{review.comment}</p>}

              <form action={updateReviewModeration} className="mt-4 space-y-2">
                <input type="hidden" name="reviewId" value={review.id} />
                <label htmlFor={`reply-${review.id}`} className="text-xs font-medium text-slate-500">
                  Réponse du commerçant
                </label>
                <textarea
                  id={`reply-${review.id}`}
                  name="merchantReply"
                  rows={2}
                  defaultValue={review.merchant_reply ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="isVisible"
                      defaultChecked={review.is_visible}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                    />
                    Visible sur la boutique
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
