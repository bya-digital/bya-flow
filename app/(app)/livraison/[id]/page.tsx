import { notFound } from "next/navigation";
import { ShippingMethodForm } from "@/components/livraison/ShippingMethodForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateShippingMethod } from "@/lib/actions/shipping";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export default async function MethodeLivraisonDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();
  const { data: method } = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!method) notFound();

  return (
    <>
      <PageHeader title={method.name} description="Modifier la méthode de livraison." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <ShippingMethodForm action={updateShippingMethod} method={method} />
        </CardContent>
      </Card>
    </>
  );
}
