import { FaqForm } from "@/components/boutique/FaqForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createFaq } from "@/lib/actions/storeContent";

export default function NouvelleFaqPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <>
      <PageHeader title="Nouvelle question" description="Ajoutez une question fréquente." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <FaqForm action={createFaq} />
        </CardContent>
      </Card>
    </>
  );
}
