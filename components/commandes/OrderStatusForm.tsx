"use client";

import { Button } from "@/components/ui/Button";
import { updateOrder } from "@/lib/actions/orders";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

interface ShippingAddress {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export function OrderStatusForm({
  orderId,
  status,
  paymentStatus,
  notes,
  shippingAddress,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  shippingAddress: ShippingAddress | null;
}) {
  return (
    <form action={updateOrder} className="space-y-5">
      <input type="hidden" name="orderId" value={orderId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={labelClasses}>
            Statut
          </label>
          <select id="status" name="status" defaultValue={status} className={inputClasses}>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="processing">En préparation</option>
            <option value="shipped">Expédiée</option>
            <option value="delivered">Livrée</option>
            <option value="cancelled">Annulée</option>
            <option value="refunded">Remboursée</option>
          </select>
        </div>
        <div>
          <label htmlFor="paymentStatus" className={labelClasses}>
            Paiement
          </label>
          <select
            id="paymentStatus"
            name="paymentStatus"
            defaultValue={paymentStatus}
            className={inputClasses}
          >
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="refunded">Remboursé</option>
          </select>
        </div>
      </div>

      <div>
        <p className={labelClasses}>Adresse de livraison</p>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          <input
            name="shippingName"
            placeholder="Nom"
            defaultValue={shippingAddress?.name ?? ""}
            className={inputClasses}
          />
          <input
            name="shippingAddressLine"
            placeholder="Adresse"
            defaultValue={shippingAddress?.address ?? ""}
            className={inputClasses}
          />
          <input
            name="shippingCity"
            placeholder="Ville"
            defaultValue={shippingAddress?.city ?? ""}
            className={inputClasses}
          />
          <input
            name="shippingPostalCode"
            placeholder="Code postal"
            defaultValue={shippingAddress?.postalCode ?? ""}
            className={inputClasses}
          />
          <input
            name="shippingCountry"
            placeholder="Pays"
            defaultValue={shippingAddress?.country ?? ""}
            className={inputClasses}
          />
        </div>
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

      <Button type="submit">Enregistrer</Button>
    </form>
  );
}
