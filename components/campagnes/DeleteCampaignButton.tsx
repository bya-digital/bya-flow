"use client";

import { Trash2 } from "lucide-react";
import { deleteCampaign } from "@/lib/actions/campaigns";

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  return (
    <form
      action={deleteCampaign}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement cette campagne ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer la campagne
      </button>
    </form>
  );
}
