import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createFunnel } from "@/lib/actions/funnels";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

export default function NouveauFunnelPage() {
  return (
    <>
      <PageHeader title="Nouveau funnel" description="Donnez-lui un nom pour commencer." />

      <Card className="max-w-xl">
        <CardContent>
          <form action={createFunnel} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Nom du funnel
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="ex. Lancement Formation X"
                className={inputClasses}
              />
            </div>
            <Button type="submit">Créer le funnel</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
