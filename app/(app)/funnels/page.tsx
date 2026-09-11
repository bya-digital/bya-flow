import { Plus, Workflow } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface FunnelRow {
  id: string;
  name: string;
}

export default async function FunnelsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();

  let funnels: FunnelRow[] = [];
  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("funnels")
      .select("id, name")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    funnels = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Funnels"
        description="Enchaînez vos pages et produits en un parcours de vente ordonné."
        action={
          <Link
            href="/funnels/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau funnel
          </Link>
        }
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      {funnels.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="Aucun funnel"
          description="Créez votre premier parcours de vente."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Funnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funnels.map((funnel) => (
                <tr key={funnel.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/funnels/${funnel.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {funnel.name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
