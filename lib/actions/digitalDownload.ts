"use server";

import { createClient } from "@/lib/supabase/server";

interface DigitalFileRow {
  file_path: string | null;
  file_name: string | null;
}

export interface DigitalDownloadResult {
  url: string | null;
  fileName: string | null;
  error?: string;
}

// URL signée à durée de vie courte, générée à la demande — jamais mise
// en cache ni exposée ailleurs. get_digital_file_for_download() vérifie
// déjà que l'appelant a payé cette ligne de commande précise, mais la
// vraie barrière reste la policy RLS du bucket (createSignedUrl() la
// revérifie indépendamment) : même en cas de bug ici, un acheteur non
// autorisé n'obtiendrait aucune URL exploitable.
export async function getDigitalDownloadUrl(orderItemId: string): Promise<DigitalDownloadResult> {
  const supabase = createClient();

  const { data: file } = await supabase
    .rpc("get_digital_file_for_download", { p_order_item_id: orderItemId })
    .maybeSingle<DigitalFileRow>();

  if (!file?.file_path) {
    return { url: null, fileName: null, error: "Fichier indisponible." };
  }

  const { data: signed, error } = await supabase.storage
    .from("digital-products")
    .createSignedUrl(file.file_path, 300);

  if (error || !signed) {
    return { url: null, fileName: null, error: "Le lien de téléchargement n'a pas pu être généré." };
  }

  await supabase.rpc("record_product_download", { p_order_item_id: orderItemId });

  return { url: signed.signedUrl, fileName: file.file_name };
}
