"use client";

import { FileText, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { deleteDigitalFile, uploadDigitalFile } from "@/lib/actions/products";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DigitalFileUpload({
  productId,
  fileName,
  fileSize,
}: {
  productId: string;
  fileName: string | null;
  fileSize: number | null;
}) {
  const uploadFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      {fileName ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{fileName}</p>
              <p className="text-xs text-slate-400">{formatSize(fileSize)}</p>
            </div>
          </div>
          <form action={deleteDigitalFile}>
            <input type="hidden" name="productId" value={productId} />
            <button
              type="submit"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Supprimer le fichier"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Aucun fichier — ce produit n&apos;est pas encore vendable.</p>
      )}

      <form action={uploadDigitalFile} ref={uploadFormRef}>
        <input type="hidden" name="productId" value={productId} />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600">
          <Upload className="h-4 w-4" />
          {fileName ? "Remplacer le fichier" : "Ajouter le fichier"}
          <input
            type="file"
            name="file"
            className="hidden"
            onChange={() => uploadFormRef.current?.requestSubmit()}
          />
        </label>
      </form>
      <p className="text-xs text-slate-400">
        Jamais accessible publiquement — livré uniquement après paiement confirmé, via un lien
        temporaire.
      </p>
    </div>
  );
}
