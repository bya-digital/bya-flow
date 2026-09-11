import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteFunnelButton } from "@/components/funnels/DeleteFunnelButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { addFunnelStep, moveFunnelStep, removeFunnelStep } from "@/lib/actions/funnels";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

interface StepRow {
  id: string;
  position: number;
  step_type: string;
  label: string | null;
  store_pages: { title: string; slug: string } | null;
  products: { name: string; slug: string } | null;
}

export default async function FunnelDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();

  const [{ data: funnel }, { data: stepsData }, { data: pages }, { data: products }, { data: stats }] =
    await Promise.all([
      supabase.from("funnels").select("id, name").eq("id", params.id).maybeSingle(),
      supabase
        .from("funnel_steps")
        .select("id, position, step_type, label, store_pages(title, slug), products(name, slug)")
        .eq("funnel_id", params.id)
        .order("position", { ascending: true }),
      supabase.from("store_pages").select("id, title").eq("store_id", store.id).order("title"),
      supabase.from("products").select("id, name").eq("store_id", store.id).order("name"),
      supabase.rpc("get_funnel_step_stats", { p_funnel_id: params.id }),
    ]);

  if (!funnel) notFound();

  const steps = (stepsData ?? []) as unknown as StepRow[];
  const statsByStep = new Map<string, number>(
    ((stats ?? []) as { funnel_step_id: string; visit_count: number }[]).map((row) => [
      row.funnel_step_id,
      Number(row.visit_count),
    ])
  );

  return (
    <>
      <PageHeader title={funnel.name} description="Funnel de vente." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {steps.length === 0 && (
            <p className="text-sm text-slate-400">Aucune étape — ajoutez une page ou un produit.</p>
          )}

          {steps.map((step, index) => {
            const title =
              step.step_type === "page" ? step.store_pages?.title : step.products?.name;
            const url =
              step.step_type === "page"
                ? `/store/${store.slug}/pages/${step.store_pages?.slug}`
                : `/store/${store.slug}/produits/${step.products?.slug}`;
            const visitCount = statsByStep.get(step.id) ?? 0;

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Étape {index + 1} — {step.step_type === "page" ? "Page" : "Produit"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{title ?? "—"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {visitCount} visiteur{visitCount !== 1 ? "s" : ""} unique
                        {visitCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={url}
                        target="_blank"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                        aria-label="Voir"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <form action={moveFunnelStep}>
                        <input type="hidden" name="funnelId" value={funnel.id} />
                        <input type="hidden" name="stepId" value={step.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          aria-label="Monter"
                        >
                          ↑
                        </button>
                      </form>
                      <form action={moveFunnelStep}>
                        <input type="hidden" name="funnelId" value={funnel.id} />
                        <input type="hidden" name="stepId" value={step.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === steps.length - 1}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          aria-label="Descendre"
                        >
                          ↓
                        </button>
                      </form>
                      <form action={removeFunnelStep}>
                        <input type="hidden" name="funnelId" value={funnel.id} />
                        <input type="hidden" name="stepId" value={step.id} />
                        <button
                          type="submit"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
                )}
              </div>
            );
          })}

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Ajouter une étape</h2>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <form action={addFunnelStep}>
                  <input type="hidden" name="funnelId" value={funnel.id} />
                  <input type="hidden" name="stepType" value="page" />
                  <label className="text-xs font-medium text-slate-500">Page</label>
                  <select name="refId" className={inputClasses}>
                    <option value="">Choisir une page</option>
                    {(pages ?? []).map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" className="mt-2">
                    Ajouter cette page
                  </Button>
                </form>

                <form action={addFunnelStep}>
                  <input type="hidden" name="funnelId" value={funnel.id} />
                  <input type="hidden" name="stepType" value="product" />
                  <label className="text-xs font-medium text-slate-500">Produit</label>
                  <select name="refId" className={inputClasses}>
                    <option value="">Choisir un produit</option>
                    {(products ?? []).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" className="mt-2">
                    Ajouter ce produit
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Zone dangereuse</h2>
            </CardHeader>
            <CardContent>
              <DeleteFunnelButton funnelId={funnel.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
