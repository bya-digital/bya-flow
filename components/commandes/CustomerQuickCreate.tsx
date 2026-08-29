"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createCustomer } from "@/lib/actions/customers";

export function CustomerQuickCreate({ redirectTo }: { redirectTo: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
      >
        <Plus className="h-3 w-3" />
        Nouveau client
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        placeholder="Nom du client"
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
      <button
        type="button"
        disabled={isPending || !name.trim()}
        onClick={() => {
          const formData = new FormData();
          formData.set("fullName", name);
          formData.set("redirectTo", redirectTo);
          startTransition(() => {
            createCustomer(formData);
          });
        }}
        className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
      >
        Ajouter
      </button>
    </div>
  );
}
