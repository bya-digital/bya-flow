"use client";

import type { CSSProperties } from "react";
import { useFormStatus } from "react-dom";

export function LeadFormSubmitButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`} style={style}>
      {pending ? "Envoi..." : children}
    </button>
  );
}
