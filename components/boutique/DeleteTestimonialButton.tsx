"use client";

import { Trash2 } from "lucide-react";
import { deleteTestimonial } from "@/lib/actions/storeContent";

export function DeleteTestimonialButton({ testimonialId }: { testimonialId: string }) {
  return (
    <form
      action={deleteTestimonial}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement ce témoignage ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="testimonialId" value={testimonialId} />
      <button
        type="submit"
        className="text-slate-400 hover:text-red-600"
        aria-label="Supprimer le témoignage"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
