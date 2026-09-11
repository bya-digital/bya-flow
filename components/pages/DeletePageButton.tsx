"use client";

import { Trash2 } from "lucide-react";
import { deletePage } from "@/lib/actions/pages";

export function DeletePageButton({ pageId }: { pageId: string }) {
  return (
    <form
      action={deletePage}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement cette page ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="pageId" value={pageId} />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer la page
      </button>
    </form>
  );
}
