"use client";

import { Check, ChevronDown, Plus, Store as StoreIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { switchStore } from "@/lib/actions/store";

interface StoreOption {
  id: string;
  name: string;
}

export function StoreSwitcher({
  stores,
  currentStoreId,
}: {
  stores: StoreOption[];
  currentStoreId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (stores.length === 0) return null;

  const current = stores.find((store) => store.id === currentStoreId) ?? stores[0];

  if (stores.length === 1) {
    return (
      <span className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 sm:flex">
        <StoreIcon className="h-3.5 w-3.5 text-slate-400" />
        {current.name}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <StoreIcon className="h-3.5 w-3.5 text-slate-400" />
        <span className="max-w-[10rem] truncate">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {stores.map((store) => (
              <form key={store.id} action={switchStore}>
                <input type="hidden" name="storeId" value={store.id} />
                <input type="hidden" name="redirect" value={pathname} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <span className="truncate">{store.name}</span>
                  {store.id === current.id && (
                    <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  )}
                </button>
              </form>
            ))}
            <Link
              href="/boutique"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-md border-t border-slate-100 px-2 py-1.5 pt-2 text-sm font-medium text-brand-600 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Nouvelle boutique
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
