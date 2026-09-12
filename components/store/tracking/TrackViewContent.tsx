"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/tracking/events";

export function TrackViewContent({
  productId,
  productName,
  price,
  currency,
}: {
  productId: string;
  productName: string;
  price: number;
  currency: string;
}) {
  useEffect(() => {
    trackViewContent({ id: productId, name: productName, price }, currency);
  }, [productId, productName, price, currency]);

  return null;
}
