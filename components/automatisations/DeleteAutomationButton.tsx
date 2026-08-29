"use client";

import { Trash2 } from "lucide-react";
import { deleteAutomation } from "@/lib/actions/automations";

export function DeleteAutomationButton({ automationId }: { automationId: string }) {
  return (
    <form
      action={deleteAutomation}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement cette automatisation ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="automationId" value={automationId} />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer l&apos;automatisation
      </button>
    </form>
  );
}
