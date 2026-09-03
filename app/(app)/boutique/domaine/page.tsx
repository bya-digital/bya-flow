import { CheckCircle2, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { removeCustomDomain, updateCustomDomain } from "@/lib/actions/customDomain";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getCurrentStore } from "@/lib/data/store";

export default async function BoutiqueDomainePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  return (
    <>
      <PageHeader
        title="Domaine personnalisé"
        description="Faites pointer votre propre domaine (ex. maboutique.com) vers votre boutique."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.success && (
        <Alert
          tone="success"
          title="Domaine enregistré"
          description="En attente de rattachement par BYA Digital — voir les instructions ci-dessous."
          className="mb-6"
        />
      )}

      <div className="max-w-xl space-y-4">
        {store.custom_domain ? (
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{store.custom_domain}</p>
                  {store.custom_domain_verified_at ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Actif
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-600">
                      <Clock className="h-4 w-4" /> En attente de rattachement
                    </p>
                  )}
                </div>
                <form action={removeCustomDomain}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                </form>
              </div>

              {!store.custom_domain_verified_at && (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">Prochaines étapes</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4">
                    <li>
                      Chez votre registraire de domaine, ajoutez un enregistrement DNS de type
                      CNAME pour <code className="text-xs">{store.custom_domain}</code> pointant
                      vers <code className="text-xs">cname.vercel-dns.com</code>.
                    </li>
                    <li>Contactez BYA Digital pour rattacher le domaine à votre boutique.</li>
                    <li>Une fois confirmé, votre boutique sera accessible sur ce domaine.</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <form action={updateCustomDomain} className="space-y-4">
                <div>
                  <label htmlFor="domain" className="text-sm font-medium text-slate-700">
                    Votre domaine
                  </label>
                  <input
                    id="domain"
                    name="domain"
                    required
                    placeholder="maboutique.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Vous devez déjà posséder ce domaine (acheté chez un registraire de votre choix).
                  Après l&apos;avoir enregistré ici, BYA Digital vous indiquera comment configurer
                  le DNS.
                </p>
                <SubmitButton pendingText="Enregistrement...">Utiliser ce domaine</SubmitButton>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
