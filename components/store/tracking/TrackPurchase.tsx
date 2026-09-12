"use client";

import { useEffect } from "react";
import { trackPurchase, type TrackItem } from "@/lib/tracking/events";

// Un rechargement de la page de confirmation (favori, retour
// navigateur, partage du lien) ne doit jamais recompter le même achat
// — clé de session par commande, jamais par cookie global (une autre
// commande du même client doit tout de même se compter).
export function TrackPurchase({
  orderId,
  items,
  value,
  currency,
}: {
  orderId: string;
  items: TrackItem[];
  value: number;
  currency: string;
}) {
  useEffect(() => {
    const key = `bya_purchase_tracked_${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage indisponible (navigation privée stricte) : on
      // envoie tout de même l'événement plutôt que de le perdre.
    }
    trackPurchase(orderId, items, value, currency);
  }, [orderId, items, value, currency]);

  return null;
}
