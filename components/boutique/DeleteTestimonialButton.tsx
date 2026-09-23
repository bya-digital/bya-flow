"use client";

import { Trash2 } from "lucide-react";
import { InlineSubmitButton } from "@/components/ui/InlineSubmitButton";
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
      <InlineSubmitButton
        className="text-slate-400 hover:text-red-600"
        aria-label="Supprimer le témoignage"
        pendingContent={<Trash2 className="h-4 w-4 animate-pulse" />}
      >
        <Trash2 className="h-4 w-4" />
      </InlineSubmitButton>
    </form>
  );
}
