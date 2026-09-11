"use client";

import { Download } from "lucide-react";
import { useState, useTransition } from "react";
import { getDigitalDownloadUrl } from "@/lib/actions/digitalDownload";

export function DigitalDownloadButton({ orderItemId }: { orderItemId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await getDigitalDownloadUrl(orderItemId);
      if (!result.url) {
        setError(result.error ?? "Téléchargement indisponible.");
        return;
      }
      // Lien à usage court (5 min) : ouvert immédiatement, jamais
      // conservé ni réaffiché ailleurs dans l'UI.
      window.location.href = result.url;
    });
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {isPending ? "Préparation..." : "Télécharger"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
