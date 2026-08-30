"use client";

import { X } from "lucide-react";
import { revokeInvitation } from "@/lib/actions/team";

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  return (
    <form
      action={revokeInvitation}
      onSubmit={(e) => {
        if (!window.confirm("Annuler cette invitation ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="invitationId" value={invitationId} />
      <button
        type="submit"
        className="text-slate-400 hover:text-red-600"
        aria-label="Annuler l'invitation"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}
