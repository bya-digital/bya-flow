"use client";

import { X } from "lucide-react";
import { InlineSubmitButton } from "@/components/ui/InlineSubmitButton";
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
      <InlineSubmitButton
        className="text-slate-400 hover:text-red-600"
        aria-label="Annuler l'invitation"
        pendingContent={<X className="h-4 w-4 animate-pulse" />}
      >
        <X className="h-4 w-4" />
      </InlineSubmitButton>
    </form>
  );
}
