"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./Button";

interface SubmitButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  pendingText?: string;
}

// Sans ce retour visuel, un envoi un peu lent (cold start serverless,
// aller-retour Supabase) donne l'impression que rien ne se passe — le
// bouton reste identique, rien n'indique que le clic a été pris en compte.
export function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (pendingText ?? "Chargement...") : children}
    </Button>
  );
}
