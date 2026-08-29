import { MessageSquareQuote, Plus } from "lucide-react";
import Link from "next/link";
import { DeleteTestimonialButton } from "@/components/boutique/DeleteTestimonialButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface TestimonialRow {
  id: string;
  author_name: string;
  quote: string;
  is_active: boolean;
}

export default async function TemoignagesPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  let testimonials: TestimonialRow[] = [];
  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("store_testimonials")
      .select("id, author_name, quote, is_active")
      .eq("store_id", store.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    testimonials = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Témoignages"
        description="Avis affichés sur votre boutique publique."
        action={
          <Link
            href="/boutique/temoignages/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau témoignage
          </Link>
        }
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Modifications enregistrées" />
        </div>
      )}

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Aucun témoignage"
          description="Ajoutez un avis client pour renforcer la confiance sur votre boutique."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/boutique/temoignages/${testimonial.id}`}
                    className="font-medium text-slate-900 hover:text-brand-600"
                  >
                    {testimonial.author_name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">&laquo;&nbsp;{testimonial.quote}&nbsp;&raquo;</p>
                </div>
                <DeleteTestimonialButton testimonialId={testimonial.id} />
              </div>
              <Badge tone={testimonial.is_active ? "success" : "neutral"} className="mt-3">
                {testimonial.is_active ? "Visible" : "Masqué"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
