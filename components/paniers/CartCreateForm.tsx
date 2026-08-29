"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CustomerQuickCreate } from "@/components/commandes/CustomerQuickCreate";
import { Button } from "@/components/ui/Button";
import { createCart } from "@/lib/actions/carts";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";
const cellInputClasses =
  "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Customer {
  id: string;
  full_name: string;
}

interface LineItemRow {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export function CartCreateForm({
  products,
  customers,
  preSelectedCustomerId,
}: {
  products: Product[];
  customers: Customer[];
  preSelectedCustomerId?: string;
}) {
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);

  const addLineItem = () => {
    const firstProduct = products[0];
    setLineItems((prev) => [
      ...prev,
      {
        productId: firstProduct?.id ?? "",
        quantity: "1",
        unitPrice: firstProduct?.price.toString() ?? "0",
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof LineItemRow, value: string) => {
    setLineItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          return { ...row, productId: value, unitPrice: product?.price.toString() ?? row.unitPrice };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = lineItems.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <form action={createCart} className="space-y-6">
      <input type="hidden" name="lineItems" value={JSON.stringify(lineItems)} />

      <div>
        <label htmlFor="customerId" className={labelClasses}>
          Client
        </label>
        <select
          id="customerId"
          name="customerId"
          defaultValue={preSelectedCustomerId ?? ""}
          className={inputClasses}
        >
          <option value="">Aucun</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name}
            </option>
          ))}
        </select>
        <CustomerQuickCreate redirectTo="/paniers-abandonnes/nouveau" />
      </div>

      <div>
        <p className={labelClasses}>Produits</p>
        {lineItems.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Produit</th>
                  <th className="pb-2">Quantité</th>
                  <th className="pb-2">Prix unitaire</th>
                  <th className="pb-2">Sous-total</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((row, index) => {
                  const subtotal = Number(row.unitPrice || 0) * Number(row.quantity || 0);
                  return (
                    <tr key={index}>
                      <td className="py-1.5 pr-2">
                        <select
                          value={row.productId}
                          onChange={(e) => updateLineItem(index, "productId", e.target.value)}
                          className={cellInputClasses}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                          className={cellInputClasses}
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.unitPrice}
                          onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                          className={cellInputClasses}
                        />
                      </td>
                      <td className="py-1.5 pr-2 text-slate-500">{subtotal.toFixed(2)} €</td>
                      <td className="py-1.5">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-slate-400 hover:text-red-600"
                          aria-label="Retirer la ligne"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          onClick={addLineItem}
          disabled={products.length === 0}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
        <p className="mt-3 text-right text-sm font-semibold text-slate-900">
          Total : {total.toFixed(2)} €
        </p>
      </div>

      <div>
        <label htmlFor="notes" className={labelClasses}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} className={inputClasses} />
      </div>

      <Button type="submit">Enregistrer le panier</Button>
    </form>
  );
}
