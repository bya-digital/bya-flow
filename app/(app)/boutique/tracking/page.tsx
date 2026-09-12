import { notFound } from "next/navigation";
import { updateStoreTracking } from "@/lib/actions/store";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getCurrentStore } from "@/lib/data/store";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export default async function BoutiqueTrackingPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  return (
    <>
      <PageHeader
        title="Tracking"
        description="Connectez vos propres comptes Meta Pixel, Google Analytics 4 et Google Tag Manager pour suivre vos ventes."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.success && (
        <Alert tone="success" title="Paramètres enregistrés" className="mb-6" />
      )}

      <div className="max-w-xl space-y-4">
        <Alert
          tone="info"
          title="Vos propres identifiants, aucun engagement de notre part"
          description="Ces identifiants sont publics par nature (visibles dans le code de toute page qui les utilise) — nous ne les considérons pas comme des secrets. Laissez un champ vide pour désactiver ce tracking."
        />

        <Card>
          <CardContent>
            <form action={updateStoreTracking} className="space-y-4">
              <div>
                <label htmlFor="metaPixelId" className={labelClasses}>
                  Meta Pixel ID
                </label>
                <input
                  id="metaPixelId"
                  name="metaPixelId"
                  defaultValue={store.meta_pixel_id ?? ""}
                  placeholder="123456789012345"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Events Manager de votre compte Meta Business — suivi des vues produit, ajouts
                  au panier et achats.
                </p>
              </div>
              <div>
                <label htmlFor="ga4MeasurementId" className={labelClasses}>
                  Google Analytics 4 — Measurement ID
                </label>
                <input
                  id="ga4MeasurementId"
                  name="ga4MeasurementId"
                  defaultValue={store.ga4_measurement_id ?? ""}
                  placeholder="G-XXXXXXXXXX"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="gtmContainerId" className={labelClasses}>
                  Google Tag Manager — Container ID
                </label>
                <input
                  id="gtmContainerId"
                  name="gtmContainerId"
                  defaultValue={store.gtm_container_id ?? ""}
                  placeholder="GTM-XXXXXXX"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Optionnel — les événements (vue produit, ajout panier, début de commande,
                  achat) sont aussi poussés dans le dataLayer GTM.
                </p>
              </div>

              <SubmitButton pendingText="Enregistrement...">Enregistrer</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
