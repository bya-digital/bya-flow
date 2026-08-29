import { TestimonialForm } from "@/components/boutique/TestimonialForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createTestimonial } from "@/lib/actions/storeContent";

export default function NouveauTemoignagePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <PageHeader title="Nouveau témoignage" description="Ajoutez un avis client." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <TestimonialForm action={createTestimonial} />
        </CardContent>
      </Card>
    </>
  );
}
