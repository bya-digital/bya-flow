"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteProduct } from "@/lib/actions/products";

// Bouton dédié (bordure/couleurs sur mesure, ne correspond à aucune
// variante fixe de Button) — on garde le confirm() du <form> intact et on
// ajoute juste le retour visuel pendant le pending.
function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Suppression..." : "Supprimer le produit"}
    </button>
  );
}

export function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement ce produit ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <DeleteButton />
    </form>
  );
}
