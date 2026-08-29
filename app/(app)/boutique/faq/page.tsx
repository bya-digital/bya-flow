import { HelpCircle, Plus } from "lucide-react";
import Link from "next/link";
import { DeleteFaqButton } from "@/components/boutique/DeleteFaqButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
}

export default async function FaqPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  let faqs: FaqRow[] = [];
  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("store_faqs")
      .select("id, question, answer, is_active")
      .eq("store_id", store.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    faqs = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="FAQ"
        description="Questions fréquentes affichées sur votre boutique publique."
        action={
          <Link
            href="/boutique/faq/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle question
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

      {faqs.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Aucune question"
          description="Ajoutez les questions que vos clients posent le plus souvent."
        />
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/boutique/faq/${faq.id}`}
                    className="font-medium text-slate-900 hover:text-brand-600"
                  >
                    {faq.question}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{faq.answer}</p>
                </div>
                <DeleteFaqButton faqId={faq.id} />
              </div>
              <Badge tone={faq.is_active ? "success" : "neutral"} className="mt-3">
                {faq.is_active ? "Visible" : "Masquée"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
