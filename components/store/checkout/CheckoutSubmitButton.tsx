"use client";

import { useFormStatus } from "react-dom";

// Bouton dédié (plutôt que le SubmitButton générique) pour conserver
// l'accent de couleur de la boutique (--store-accent) sans passer par
// les variantes de couleur fixes du composant Button. Même correction
// que SubmitButton : sans retour visuel, un clic sur "Confirmer la
// commande" (écriture réelle en base) donne l'impression que rien ne
// se passe.
export function CheckoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
      style={{ backgroundColor: "var(--store-accent)" }}
    >
      {pending ? "Envoi en cours..." : "Confirmer la commande"}
    </button>
  );
}
