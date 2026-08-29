import { notFound } from "next/navigation";
import { TestimonialForm } from "@/components/boutique/TestimonialForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateTestimonial } from "@/lib/actions/storeContent";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export default async function TemoignageDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();
  const { data: testimonial } = await supabase
    .from("store_testimonials")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!testimonial) notFound();

  return (
    <>
      <PageHeader title={testimonial.author_name} description="Modifier le témoignage." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <TestimonialForm action={updateTestimonial} testimonial={testimonial} />
        </CardContent>
      </Card>
    </>
  );
}
