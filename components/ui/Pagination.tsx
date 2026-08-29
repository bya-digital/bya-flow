import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>
        Page {page} sur {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={`${basePath}?page=${page - 1}`}
          aria-disabled={page <= 1}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 font-medium ${
            page <= 1
              ? "pointer-events-none border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Link>
        <Link
          href={`${basePath}?page=${page + 1}`}
          aria-disabled={page >= totalPages}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 font-medium ${
            page >= totalPages
              ? "pointer-events-none border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
