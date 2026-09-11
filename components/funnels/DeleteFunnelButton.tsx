"use client";

import { Trash2 } from "lucide-react";
import { deleteFunnel } from "@/lib/actions/funnels";

export function DeleteFunnelButton({ funnelId }: { funnelId: string }) {
  return (
    <form
      action={deleteFunnel}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement ce funnel ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="funnelId" value={funnelId} />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer le funnel
      </button>
    </form>
  );
}
