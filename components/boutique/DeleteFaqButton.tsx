"use client";

import { Trash2 } from "lucide-react";
import { deleteFaq } from "@/lib/actions/storeContent";

export function DeleteFaqButton({ faqId }: { faqId: string }) {
  return (
    <form
      action={deleteFaq}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement cette question ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="faqId" value={faqId} />
      <button
        type="submit"
        className="text-slate-400 hover:text-red-600"
        aria-label="Supprimer la question"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
