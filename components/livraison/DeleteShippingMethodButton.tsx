"use client";

import { Trash2 } from "lucide-react";
import { deleteShippingMethod } from "@/lib/actions/shipping";

export function DeleteShippingMethodButton({ methodId }: { methodId: string }) {
  return (
    <form
      action={deleteShippingMethod}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement cette méthode de livraison ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="methodId" value={methodId} />
      <button
        type="submit"
        className="text-slate-400 hover:text-red-600"
        aria-label="Supprimer la méthode de livraison"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
