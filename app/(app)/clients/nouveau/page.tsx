import { ClientForm } from "@/components/clients/ClientForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createCustomer } from "@/lib/actions/customers";

export default function NouveauClientPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <PageHeader title="Nouveau client" description="Ajoutez un prospect ou un client." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <ClientForm action={createCustomer} />
        </CardContent>
      </Card>
    </>
  );
}
