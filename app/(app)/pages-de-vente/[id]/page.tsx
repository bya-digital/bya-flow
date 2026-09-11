import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeletePageButton } from "@/components/pages/DeletePageButton";
import { PageEditor } from "@/components/pages/PageEditor";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { setPageStatus, updatePageMeta } from "@/lib/actions/pages";
import type { Block } from "@/lib/pageBuilder/types";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

export default async function PageDeVenteDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();

  const [{ data: page }, { data: products }] = await Promise.all([
    supabase.from("store_pages").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("products").select("id, name").eq("store_id", store.id).order("name"),
  ]);

  if (!page) notFound();

  const publicUrl = `/store/${store.slug}/pages/${page.slug}`;

  return (
    <>
      <PageHeader
        title={page.title}
        description="Page de vente."
        action={
          <Link
            href={publicUrl}
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            Voir la page
          </Link>
        }
      />

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Contenu</h2>
            </CardHeader>
            <CardContent>
              <PageEditor
                pageId={page.id}
                initialBlocks={(page.blocks as Block[] | null) ?? []}
                products={products ?? []}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Réglages</h2>
            </CardHeader>
            <CardContent>
              <form action={updatePageMeta} className="space-y-3">
                <input type="hidden" name="pageId" value={page.id} />
                <div>
                  <label htmlFor="title" className="text-xs font-medium text-slate-500">
                    Titre
                  </label>
                  <input id="title" name="title" defaultValue={page.title} className={inputClasses} />
                </div>
                <div>
                  <label htmlFor="slug" className="text-xs font-medium text-slate-500">
                    URL
                  </label>
                  <input id="slug" name="slug" defaultValue={page.slug} className={inputClasses} />
                </div>
                <Button type="submit" size="sm">
                  Enregistrer
                </Button>
              </form>

              <form action={setPageStatus} className="mt-4 border-t border-slate-100 pt-4">
                <input type="hidden" name="pageId" value={page.id} />
                <input
                  type="hidden"
                  name="status"
                  value={page.status === "published" ? "draft" : "published"}
                />
                <Button
                  type="submit"
                  variant={page.status === "published" ? "secondary" : "primary"}
                  size="sm"
                >
                  {page.status === "published" ? "Dépublier" : "Publier"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Zone dangereuse</h2>
            </CardHeader>
            <CardContent>
              <DeletePageButton pageId={page.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
