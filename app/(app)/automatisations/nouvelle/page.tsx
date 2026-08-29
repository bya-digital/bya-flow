import { AutomationForm } from "@/components/automatisations/AutomationForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createAutomation } from "@/lib/actions/automations";

export default function NouvelleAutomatisationPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <PageHeader
        title="Nouvelle automatisation"
        description="Réagissez automatiquement à un événement de votre boutique."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <AutomationForm action={createAutomation} />
        </CardContent>
      </Card>
    </>
  );
}
