import { Gift } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createOrderBump, deleteOrderBump, toggleOrderBump } from "@/lib/actions/orderBumps";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

interface BumpRow {
  id: string;
  headline: string | null;
  is_active: boolean;
  trigger: { name: string } | null;
  bump: { name: string; price: number } | null;
}

export default async function OrderBumpsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  let bumps: BumpRow[] = [];
  let products: { id: string; name: string }[] = [];

  if (store) {
    const supabase = createClient();
    const [{ data: bumpsData }, { data: productsData }] = await Promise.all([
      supabase
        .from("order_bumps")
        .select(
          "id, headline, is_active, trigger:products!order_bumps_trigger_product_id_fkey(name), bump:products!order_bumps_bump_product_id_fkey(name, price)"
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id, name").eq("store_id", store.id).order("name"),
    ]);
    bumps = (bumpsData ?? []) as unknown as BumpRow[];
    products = productsData ?? [];
  }

  return (
    <>
      <PageHeader
        title="Order bumps"
        description="Proposez une offre complémentaire au checkout, cochable par le client."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Order bump créé" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {bumps.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Aucun order bump"
              description="Créez votre première offre complémentaire."
            />
          ) : (
            bumps.map((bump) => (
              <div key={bump.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {bump.trigger?.name ?? "—"} → {bump.bump?.name ?? "—"}
                  </p>
                  {bump.headline && <p className="mt-1 text-xs text-slate-500">{bump.headline}</p>}
                  {bump.bump && store && (
                    <p className="mt-1 text-xs text-slate-400">
                      +{" "}
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: store.currency,
                      }).format(bump.bump.price)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={bump.is_active ? "success" : "neutral"}>
                    {bump.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <form action={toggleOrderBump}>
                    <input type="hidden" name="bumpId" value={bump.id} />
                    <input type="hidden" name="isActive" value={String(bump.is_active)} />
                    <Button type="submit" variant="secondary" size="sm">
                      {bump.is_active ? "Désactiver" : "Activer"}
                    </Button>
                  </form>
                  <form action={deleteOrderBump}>
                    <input type="hidden" name="bumpId" value={bump.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Supprimer
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Nouvel order bump</h2>
          </CardHeader>
          <CardContent>
            <form action={createOrderBump} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Si le client achète...
                </label>
                <select name="triggerProductId" required className={inputClasses}>
                  <option value="">Choisir un produit</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  ...proposer en plus
                </label>
                <select name="bumpProductId" required className={inputClasses}>
                  <option value="">Choisir un produit</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Titre affiché (optionnel)
                </label>
                <input
                  name="headline"
                  placeholder="ex. Ajoutez l'ebook bonus !"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Description (optionnel)
                </label>
                <textarea name="description" rows={2} className={inputClasses} />
              </div>
              <Button type="submit">Créer l&apos;order bump</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
