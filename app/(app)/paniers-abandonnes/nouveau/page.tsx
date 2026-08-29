import { CartCreateForm } from "@/components/paniers/CartCreateForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export default async function NouveauPanierPage({
  searchParams,
}: {
  searchParams: { error?: string; newCustomerId?: string };
}) {
  const store = await getCurrentStore();

  let products: { id: string; name: string; price: number; stock: number }[] = [];
  let customers: { id: string; full_name: string }[] = [];

  if (store) {
    const supabase = createClient();
    const [{ data: productsData }, { data: customersData }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, stock")
        .eq("store_id", store.id)
        .eq("status", "active")
        .order("name", { ascending: true }),
      supabase
        .from("customers")
        .select("id, full_name")
        .eq("organization_id", store.organization_id)
        .order("full_name", { ascending: true }),
    ]);
    products = productsData ?? [];
    customers = customersData ?? [];
  }

  return (
    <>
      <PageHeader
        title="Nouveau panier"
        description="Enregistrez manuellement un panier en cours (devis, intérêt exprimé...)."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-3xl">
        <CardContent>
          <CartCreateForm
            products={products}
            customers={customers}
            preSelectedCustomerId={searchParams.newCustomerId}
          />
        </CardContent>
      </Card>
    </>
  );
}
