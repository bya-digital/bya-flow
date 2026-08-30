import { redirect } from "next/navigation";
import { updateLoyaltySettings } from "@/lib/actions/loyalty";
import { getCurrentStore } from "@/lib/data/store";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export default async function FidelitePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const earnRate = Number(store.loyalty_earn_rate);
  const redeemValue = Number(store.loyalty_redeem_value);
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: store.currency,
    maximumFractionDigits: 4,
  });

  return (
    <>
      <PageHeader
        title="Fidélité"
        description="Récompensez vos clients avec un programme de points, simple et transparent."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.success && (
        <Alert tone="success" title="Réglages enregistrés" className="mb-6" />
      )}

      <Card>
        <CardContent>
          <form action={updateLoyaltySettings} className="space-y-5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="loyaltyEnabled"
                defaultChecked={store.loyalty_enabled}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Activer le programme de fidélité
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="earnRate" className={labelClasses}>
                  Points gagnés par unité de {store.currency} dépensée
                </label>
                <input
                  id="earnRate"
                  name="earnRate"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={earnRate}
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Ex. 1 → une commande de 50 {store.currency} rapporte 50 points.
                </p>
              </div>
              <div>
                <label htmlFor="redeemValue" className={labelClasses}>
                  Valeur d&apos;un point à la dépense
                </label>
                <input
                  id="redeemValue"
                  name="redeemValue"
                  type="number"
                  min={0}
                  step="0.0001"
                  defaultValue={redeemValue}
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Ex. 0,01 → 100 points = {currencyFormatter.format(100 * (redeemValue || 0.01))} de
                  réduction.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Les points sont attribués automatiquement à la commande et utilisables par vos
              clients connectés à leur compte, directement au moment du paiement.
            </p>

            <div className="border-t border-slate-100 pt-5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="referralEnabled"
                  defaultChecked={store.referral_enabled}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                />
                Activer le parrainage
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Nécessite le programme de fidélité activé ci-dessus : la récompense est versée
                en points.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="referralBonusPoints" className={labelClasses}>
                    Points offerts au parrain
                  </label>
                  <input
                    id="referralBonusPoints"
                    name="referralBonusPoints"
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={store.referral_bonus_points}
                    className={inputClasses}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Versés quand la personne parrainée passe sa première commande.
                  </p>
                </div>
                <div>
                  <label htmlFor="referralWelcomePoints" className={labelClasses}>
                    Points de bienvenue pour le filleul
                  </label>
                  <input
                    id="referralWelcomePoints"
                    name="referralWelcomePoints"
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={store.referral_welcome_points}
                    className={inputClasses}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Ajoutés aux points gagnés sur sa première commande. 0 pour désactiver.
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
