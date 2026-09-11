import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { BlockRenderer } from "@/components/pages/BlockRenderer";
import { getPublicPage } from "@/lib/data/publicPages";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { createClient } from "@/lib/supabase/server";

export default async function StorePageRoute({
  params,
  searchParams,
}: {
  params: { slug: string; pageSlug: string };
  searchParams: { success?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const page = await getPublicPage(store.id, params.pageSlug);
  if (!page) notFound();

  // Statistiques par étape de funnel (Phase 40) : jamais comptée pour
  // un brouillon prévisualisé par l'équipe, uniquement une vraie page publiée.
  if (page.status === "published") {
    await createClient().rpc("record_funnel_step_visit", { p_page_id: page.id });
  }

  return (
    <div>
      {page.status === "draft" && (
        <div className="bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-700">
          Aperçu — cette page n&apos;est pas encore publiée.
        </div>
      )}
      {searchParams.success && (
        <div className="px-6 pt-6">
          <div className="mx-auto max-w-2xl">
            <Alert tone="success" title="Merci !" description="Votre inscription a bien été prise en compte." />
          </div>
        </div>
      )}
      {page.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          storeSlug={store.slug}
          pageSlug={page.slug}
          pageId={page.id}
          currency={store.currency}
          accentColor={store.accentColor || "#2563eb"}
        />
      ))}
    </div>
  );
}
