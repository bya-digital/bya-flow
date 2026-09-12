"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyAffiliateLink({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible : le lien reste affiché à copier manuellement.
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <code className="truncate rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">{url}</code>
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
