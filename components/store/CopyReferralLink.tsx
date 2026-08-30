"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyReferralLink({ storeSlug, code }: { storeSlug: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${storeSlug}?ref=${code}`
      : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible : le lien reste affiché à copier manuellement.
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="truncate rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">{link}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copié
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copier
          </>
        )}
      </button>
    </div>
  );
}
