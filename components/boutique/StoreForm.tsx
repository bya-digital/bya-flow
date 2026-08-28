"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateStore } from "@/lib/actions/store";
import type { CurrentStore } from "@/lib/data/store";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export function StoreForm({ store }: { store: CurrentStore }) {
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url);

  return (
    <form action={updateStore} className="space-y-6">
      <input type="hidden" name="storeId" value={store.id} />

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Logo de la boutique" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-slate-300">
              {store.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="logo" className={labelClasses}>
            Logo
          </label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setLogoPreview(URL.createObjectURL(file));
            }}
            className="mt-1 block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
      </div>

      <div>
        <label htmlFor="name" className={labelClasses}>
          Nom de la boutique
        </label>
        <input id="name" name="name" defaultValue={store.name} required className={inputClasses} />
      </div>

      <div>
        <label htmlFor="slug" className={labelClasses}>
          Identifiant (slug)
        </label>
        <input id="slug" name="slug" defaultValue={store.slug} className={inputClasses} />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={store.description ?? ""}
          rows={3}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className={labelClasses}>
            Pays
          </label>
          <input
            id="country"
            name="country"
            defaultValue={store.country ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Devise</label>
          <input
            value={store.currency}
            disabled
            className={`${inputClasses} bg-slate-50 text-slate-400`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={store.is_active}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
        />
        Boutique active
      </label>

      <Button type="submit">Enregistrer</Button>
    </form>
  );
}
