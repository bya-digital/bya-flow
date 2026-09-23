"use client";

import { Heart } from "lucide-react";
import { useFormStatus } from "react-dom";

export function WishlistToggleButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={isActive ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-busy={pending}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white disabled:opacity-60"
    >
      <Heart
        className={
          pending
            ? "h-4 w-4 animate-pulse text-slate-400"
            : isActive
              ? "h-4 w-4 fill-red-500 text-red-500"
              : "h-4 w-4 text-slate-500"
        }
      />
    </button>
  );
}
