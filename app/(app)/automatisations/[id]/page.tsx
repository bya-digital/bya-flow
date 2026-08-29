import { PlayCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { AutomationForm } from "@/components/automatisations/AutomationForm";
import { DeleteAutomationButton } from "@/components/automatisations/DeleteAutomationButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { runInactivityCheck, updateAutomation } from "@/lib/actions/automations";
import { createClient } from "@/lib/supabase/server";

export default async function AutomationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; success?: string; checked?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();
  const { data: automation } = await supabase
    .from("automations")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!automation) notFound();

  return (
    <>
      <PageHeader title={automation.name} description="Détail de l'automatisation." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Modifications enregistrées" />
        </div>
      )}
      {searchParams.checked !== undefined && (
        <div className="mb-4">
          <Alert
            tone="info"
            title="Vérification effectuée"
            description={`${searchParams.checked} notification(s) créée(s) pour des clients inactifs.`}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Configuration</h2>
            </CardHeader>
            <CardContent>
              <AutomationForm action={updateAutomation} automation={automation} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {automation.trigger_type === "customer_inactive" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Vérification manuelle</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-500">
                  Ce déclencheur n&apos;est pas encore automatique. Lancez la
                  vérification pour créer les notifications correspondantes.
                </p>
                <form action={runInactivityCheck}>
                  <input type="hidden" name="automationId" value={automation.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    <PlayCircle className="h-4 w-4" />
                    Exécuter maintenant
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Zone dangereuse</h2>
            </CardHeader>
            <CardContent>
              <DeleteAutomationButton automationId={automation.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
