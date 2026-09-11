import { TrendingUp } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createUpsellOffer, deleteUpsellOffer, toggleUpsellOffer } from "@/lib/actions/upsells";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

interface OfferRow {
  id: string;
  upsell_headline: string | null;
  is_active: boolean;
  trigger: { name: string } | null;
  upsell: { name: string; price: number } | null;
  downsell: { name: string } | null;
}

export default async function UpsellsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  let offers: OfferRow[] = [];
  let products: { id: string; name: string }[] = [];

  if (store) {
    const supabase = createClient();
    const [{ data: offersData }, { data: productsData }] = await Promise.all([
      supabase
        .from("upsell_offers")
        .select(
          "id, upsell_headline, is_active, trigger:products!upsell_offers_trigger_product_id_fkey(name), upsell:products!upsell_offers_upsell_product_id_fkey(name, price), downsell:products!upsell_offers_downsell_product_id_fkey(name)"
        )
        .eq("store_id", store.id)
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id, name").eq("store_id", store.id).order("name"),
    ]);
    offers = (offersData ?? []) as unknown as OfferRow[];
    products = productsData ?? [];
  }

  return (
    <>
      <PageHeader
        title="Upsell / Downsell"
        description="Proposez une offre juste après l'achat — jamais un paiement contourné, toujours une vraie commande."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Offre créée" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {offers.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Aucune offre"
              description="Créez votre première offre upsell/downsell."
            />
          ) : (
            offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {offer.trigger?.name ?? "—"} → {offer.upsell?.name ?? "—"}
                    {offer.downsell?.name ? ` (sinon ${offer.downsell.name})` : ""}
                  </p>
                  {offer.upsell_headline && (
                    <p className="mt-1 text-xs text-slate-500">{offer.upsell_headline}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={offer.is_active ? "success" : "neutral"}>
                    {offer.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <form action={toggleUpsellOffer}>
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="isActive" value={String(offer.is_active)} />
                    <Button type="submit" variant="secondary" size="sm">
                      {offer.is_active ? "Désactiver" : "Activer"}
                    </Button>
                  </form>
                  <form action={deleteUpsellOffer}>
                    <input type="hidden" name="offerId" value={offer.id} />
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
            <h2 className="text-sm font-semibold text-slate-900">Nouvelle offre</h2>
          </CardHeader>
          <CardContent>
            <form action={createUpsellOffer} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Après l&apos;achat de...</label>
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
                  Proposer en upsell
                </label>
                <select name="upsellProductId" required className={inputClasses}>
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
                  Titre de l&apos;upsell (optionnel)
                </label>
                <input name="upsellHeadline" className={inputClasses} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Si refusé, proposer en downsell (optionnel)
                </label>
                <select name="downsellProductId" className={inputClasses}>
                  <option value="">Aucun</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Titre du downsell (optionnel)
                </label>
                <input name="downsellHeadline" className={inputClasses} />
              </div>
              <Button type="submit">Créer l&apos;offre</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
