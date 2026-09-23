"use client";

import type { CSSProperties, ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Pour les boutons de soumission au style bespoke (icône seule, lien texte,
// taille compacte...) qui ne correspondent à aucune variante fixe de
// components/ui/Button — même correctif que SubmitButton/CheckoutSubmitButton :
// sans retour visuel, un clic un peu lent donne l'impression que rien ne se
// passe. Préserve exactement le markup/les classes existantes, ne change que
// le contenu et l'état disabled pendant la soumission.
export function InlineSubmitButton({
  children,
  pendingContent,
  className,
  style,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  pendingContent: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      {pending ? pendingContent : children}
    </button>
  );
}
