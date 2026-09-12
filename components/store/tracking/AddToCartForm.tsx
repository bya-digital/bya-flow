"use client";

import type { ReactNode } from "react";
import { trackAddToCart } from "@/lib/tracking/events";

// Enveloppe le <form action={addToCart}> existant sans en changer le
// comportement (toujours un vrai server action, jamais intercepté) —
// se contente de déclencher l'événement au moment du clic, avant que
// le serveur ne confirme, comme la quasi-totalité des intégrations
// Pixel/GA4 côté client.
export function AddToCartForm({
  productId,
  productName,
  price,
  currency,
  quantityInputName = "quantity",
  children,
  ...formProps
}: {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  quantityInputName?: string;
  children: ReactNode;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit">) {
  return (
    <form
      {...formProps}
      onSubmit={(e) => {
        const quantityValue = new FormData(e.currentTarget).get(quantityInputName);
        const quantity = Number(quantityValue) || 1;
        trackAddToCart({ id: productId, name: productName, price, quantity }, currency);
      }}
    >
      {children}
    </form>
  );
}
