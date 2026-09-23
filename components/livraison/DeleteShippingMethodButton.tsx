"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteShippingMethod } from "@/lib/actions/shipping";

// Icône seule sans fond ni bordure — SubmitButton générique romprait le
// style. On garde le confirm() du <form> intact et on anime l'icône
// pendant le pending (même logique que les autres boutons icône du projet).
function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="text-slate-400 hover:text-red-600 disabled:pointer-events-none disabled:opacity-60"
      aria-label="Supprimer la méthode de livraison"
    >
      <Trash2 className={pending ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
    </button>
  );
}

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
      <DeleteButton />
    </form>
  );
}
