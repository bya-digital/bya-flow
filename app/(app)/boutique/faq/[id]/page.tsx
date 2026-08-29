import { notFound } from "next/navigation";
import { FaqForm } from "@/components/boutique/FaqForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateFaq } from "@/lib/actions/storeContent";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export default async function FaqDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();
  const { data: faq } = await supabase
    .from("store_faqs")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!faq) notFound();

  return (
    <>
      <PageHeader title={faq.question} description="Modifier la question." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <FaqForm action={updateFaq} faq={faq} />
        </CardContent>
      </Card>
    </>
  );
}
