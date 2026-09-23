"use client";

import { Trash2 } from "lucide-react";
import { InlineSubmitButton } from "@/components/ui/InlineSubmitButton";
import { deleteStore } from "@/lib/actions/store";

export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  return (
    <form
      action={deleteStore}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Supprimer définitivement « ${storeName} » ? Cette action est irréversible (produits, réglages... tout est supprimé). Impossible si elle a déjà des commandes.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="storeId" value={storeId} />
      <InlineSubmitButton
        className="text-slate-400 hover:text-red-600"
        aria-label={`Supprimer ${storeName}`}
        pendingContent={<Trash2 className="h-4 w-4 animate-pulse" />}
      >
        <Trash2 className="h-4 w-4" />
      </InlineSubmitButton>
    </form>
  );
}
