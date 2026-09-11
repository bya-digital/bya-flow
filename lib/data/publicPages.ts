import { createClient } from "@/lib/supabase/server";
import type { Block } from "@/lib/pageBuilder/types";

export interface PublicPage {
  id: string;
  title: string;
  slug: string;
  status: string;
  blocks: Block[];
}

// Lit une page par slug — la RLS (store_pages_select_public) ne laisse
// passer que les pages publiées pour un visiteur anonyme ; un membre de
// la boutique connecté voit aussi ses propres brouillons (prévisualisation),
// via store_pages_select_member, sans logique supplémentaire ici.
export async function getPublicPage(storeId: string, slug: string): Promise<PublicPage | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("store_pages")
    .select("id, title, slug, status, blocks")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    status: data.status,
    blocks: (data.blocks as Block[] | null) ?? [],
  };
}
