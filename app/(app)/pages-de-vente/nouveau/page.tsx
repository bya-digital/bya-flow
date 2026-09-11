import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createPage } from "@/lib/actions/pages";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

export default function NouvellePageDeVente() {
  return (
    <>
      <PageHeader title="Nouvelle page de vente" description="Donnez-lui un titre pour commencer." />

      <Card className="max-w-xl">
        <CardContent>
          <form action={createPage} className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium text-slate-700">
                Titre de la page
              </label>
              <input id="title" name="title" required className={inputClasses} />
            </div>
            <div>
              <label htmlFor="slug" className="text-sm font-medium text-slate-700">
                URL (optionnel — dérivée du titre sinon)
              </label>
              <input id="slug" name="slug" placeholder="ex-mon-offre-speciale" className={inputClasses} />
            </div>
            <Button type="submit">Créer la page</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
