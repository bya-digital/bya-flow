import { Layout, Plus } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export default async function PagesDeVentePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();

  let pages: PageRow[] = [];
  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("store_pages")
      .select("id, title, slug, status")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    pages = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Pages de vente"
        description="Créez des pages de vente ou landing pages sans coder."
        action={
          <Link
            href="/pages-de-vente/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle page
          </Link>
        }
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      {pages.length === 0 ? (
        <EmptyState
          icon={Layout}
          title="Aucune page"
          description="Créez votre première page de vente."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/pages-de-vente/${page.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {page.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">/pages/{page.slug}</td>
                  <td className="px-4 py-3">
                    <Badge tone={page.status === "published" ? "success" : "neutral"}>
                      {page.status === "published" ? "Publiée" : "Brouillon"}
                    </Badge>
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
