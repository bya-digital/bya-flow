"use client";

import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export interface ShippingMethodFormValues {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  free_above: number | null;
  is_active: boolean;
}

export function ShippingMethodForm({
  action,
  method,
}: {
  action: (formData: FormData) => void;
  method?: ShippingMethodFormValues;
}) {
  return (
    <form action={action} className="space-y-5">
      {method?.id && <input type="hidden" name="methodId" value={method.id} />}

      <div>
        <label htmlFor="name" className={labelClasses}>
          Nom
        </label>
        <input
          id="name"
          name="name"
          defaultValue={method?.name ?? ""}
          required
          placeholder="Livraison standard"
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Description (optionnel)
        </label>
        <input
          id="description"
          name="description"
          defaultValue={method?.description ?? ""}
          placeholder="Sous 3 à 5 jours ouvrés"
          className={inputClasses}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className={labelClasses}>
            Prix
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={method?.price ?? 0}
            required
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="freeAbove" className={labelClasses}>
            Gratuite dès (optionnel)
          </label>
          <input
            id="freeAbove"
            name="freeAbove"
            type="number"
            step="0.01"
            min="0"
            defaultValue={method?.free_above ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={method?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
        />
        Proposée aux clients
      </label>

      <Button type="submit">{method?.id ? "Enregistrer" : "Créer la méthode"}</Button>
    </form>
  );
}
