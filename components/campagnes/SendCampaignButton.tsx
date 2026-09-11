"use client";

import { Send } from "lucide-react";
import { sendCampaign } from "@/lib/actions/campaigns";

export function SendCampaignButton({
  campaignId,
  isRealSend,
}: {
  campaignId: string;
  isRealSend: boolean;
}) {
  const confirmMessage = isRealSend
    ? "Cette campagne sera réellement envoyée par email via Resend à tous les contacts ciblés. Continuer ?"
    : "Aucun fournisseur email actif : l'envoi sera simulé (les destinataires ciblés seront enregistrés, mais aucun message réel ne partira). Continuer ?";

  return (
    <form
      action={sendCampaign}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Send className="h-4 w-4" />
        {isRealSend ? "Envoyer" : "Envoyer (simulation)"}
      </button>
    </form>
  );
}
