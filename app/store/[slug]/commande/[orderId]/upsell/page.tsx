import { redirect } from "next/navigation";
import { UpsellOfferView } from "@/components/checkout/UpsellOfferView";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";
import { createClient } from "@/lib/supabase/server";

interface OfferRow {
  offer_id: string | null;
  upsell_name: string;
  upsell_price: number;
  upsell_headline: string | null;
  upsell_description: string | null;
  downsell_name: string | null;
  downsell_price: number | null;
  downsell_headline: string | null;
  downsell_description: string | null;
}

export default async function UpsellOfferPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  const supabase = createClient();
  const { data: offer } = await supabase
    .rpc("get_upsell_offer_for_order", { p_order_id: params.orderId })
    .maybeSingle<OfferRow>();

  // Rien à proposer (déjà résolue, ou aucune offre configurée) : direction
  // la confirmation habituelle, jamais bloqué sur cette page.
  if (!offer?.offer_id) {
    redirect(`/store/${store.slug}/commande/${params.orderId}`);
  }

  return (
    <UpsellOfferView
      offer={{
        orderId: params.orderId,
        storeSlug: store.slug,
        currency: store.currency,
        upsell: {
          name: offer.upsell_name,
          price: Number(offer.upsell_price),
          headline: offer.upsell_headline,
          description: offer.upsell_description,
        },
        downsell: offer.downsell_name
          ? {
              name: offer.downsell_name,
              price: Number(offer.downsell_price),
              headline: offer.downsell_headline,
              description: offer.downsell_description,
            }
          : null,
      }}
    />
  );
}
