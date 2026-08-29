import { CampaignForm } from "@/components/campagnes/CampaignForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createCampaign } from "@/lib/actions/campaigns";

export default function NouvelleCampagnePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <PageHeader title="Nouvelle campagne" description="Composez votre campagne marketing." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <CampaignForm action={createCampaign} />
        </CardContent>
      </Card>
    </>
  );
}
