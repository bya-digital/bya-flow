"use client";

import { useEffect } from "react";
import { trackInitiateCheckout, type TrackItem } from "@/lib/tracking/events";

export function TrackInitiateCheckout({
  items,
  value,
  currency,
}: {
  items: TrackItem[];
  value: number;
  currency: string;
}) {
  useEffect(() => {
    trackInitiateCheckout(items, value, currency);
    // Ne doit se déclencher qu'au montage — `items` est un nouveau
    // tableau à chaque rendu du parent, l'inclure en dépendance
    // redéclencherait l'événement à chaque re-rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
