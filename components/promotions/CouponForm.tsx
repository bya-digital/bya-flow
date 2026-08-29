"use client";

import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export interface CouponFormValues {
  id?: string;
  code: string;
  type: string;
  value: number;
  min_order_amount: number | null;
  usage_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export function CouponForm({
  action,
  coupon,
}: {
  action: (formData: FormData) => void;
  coupon?: CouponFormValues;
}) {
  return (
    <form action={action} className="space-y-5">
      {coupon?.id && <input type="hidden" name="couponId" value={coupon.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className={labelClasses}>
            Code
          </label>
          <input
            id="code"
            name="code"
            defaultValue={coupon?.code ?? ""}
            required
            placeholder="BIENVENUE10"
            className={`${inputClasses} uppercase`}
          />
        </div>
        <div>
          <label htmlFor="type" className={labelClasses}>
            Type de remise
          </label>
          <select id="type" name="type" defaultValue={coupon?.type ?? "percentage"} className={inputClasses}>
            <option value="percentage">Pourcentage (%)</option>
            <option value="fixed">Montant fixe (€)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="value" className={labelClasses}>
            Valeur
          </label>
          <input
            id="value"
            name="value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={coupon?.value ?? ""}
            required
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="minOrderAmount" className={labelClasses}>
            Montant minimum de commande
          </label>
          <input
            id="minOrderAmount"
            name="minOrderAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={coupon?.min_order_amount ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="usageLimit" className={labelClasses}>
          Limite d&apos;utilisation (laisser vide pour illimité)
        </label>
        <input
          id="usageLimit"
          name="usageLimit"
          type="number"
          min="1"
          defaultValue={coupon?.usage_limit ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className={labelClasses}>
            Début de validité
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={coupon?.starts_at?.slice(0, 16) ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="endsAt" className={labelClasses}>
            Fin de validité
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={coupon?.ends_at?.slice(0, 16) ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={coupon?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
        />
        Actif
      </label>

      <Button type="submit">{coupon?.id ? "Enregistrer" : "Créer le coupon"}</Button>
    </form>
  );
}
