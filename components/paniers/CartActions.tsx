"use client";

import { Bell, RefreshCw } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { convertCartToOrder, markCartReminded, updateCartStatus } from "@/lib/actions/carts";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export function CartActions({
  cartId,
  status,
  notes,
}: {
  cartId: string;
  status: string;
  notes: string | null;
}) {
  return (
    <div className="space-y-6">
      <form action={updateCartStatus} className="space-y-4">
        <input type="hidden" name="cartId" value={cartId} />
        <div>
          <label htmlFor="status" className={labelClasses}>
            Statut
          </label>
          <select id="status" name="status" defaultValue={status} className={inputClasses}>
            <option value="active">Actif</option>
            <option value="abandoned">Abandonné</option>
            <option value="converted">Converti</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes" className={labelClasses}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={notes ?? ""}
            rows={3}
            className={inputClasses}
          />
        </div>
        <SubmitButton variant="secondary" size="sm" pendingText="Enregistrement...">
          Enregistrer
        </SubmitButton>
      </form>

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        <form action={markCartReminded}>
          <input type="hidden" name="cartId" value={cartId} />
          <SubmitButton variant="secondary" size="sm" pendingText="Mise à jour...">
            <Bell className="h-4 w-4" />
            Marquer comme relancé
          </SubmitButton>
        </form>

        {status !== "converted" && (
          <form action={convertCartToOrder}>
            <input type="hidden" name="cartId" value={cartId} />
            <SubmitButton size="sm" pendingText="Conversion...">
              <RefreshCw className="h-4 w-4" />
              Convertir en commande
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
