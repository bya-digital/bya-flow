"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { saveVariants } from "@/lib/actions/products";

interface VariantRow {
  name: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
}

interface ExistingVariant {
  name: string;
  price: number | null;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
}

const inputClasses =
  "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

function toRows(variants: ExistingVariant[]): VariantRow[] {
  return variants.map((variant) => ({
    name: variant.name,
    price: variant.price?.toString() ?? "",
    compareAtPrice: variant.compare_at_price?.toString() ?? "",
    sku: variant.sku ?? "",
    stock: variant.stock.toString(),
  }));
}

export function ProductVariants({
  productId,
  variants,
}: {
  productId: string;
  variants: ExistingVariant[];
}) {
  const [rows, setRows] = useState<VariantRow[]>(toRows(variants));

  const updateRow = (index: number, field: keyof VariantRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form action={saveVariants} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variants" value={JSON.stringify(rows)} />

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="pb-2">Nom</th>
                <th className="pb-2">Prix</th>
                <th className="pb-2">Prix comparé</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="py-1.5 pr-2">
                    <input
                      value={row.name}
                      onChange={(e) => updateRow(index, "name", e.target.value)}
                      placeholder="Ex. Rouge - M"
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.price}
                      onChange={(e) => updateRow(index, "price", e.target.value)}
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.compareAtPrice}
                      onChange={(e) => updateRow(index, "compareAtPrice", e.target.value)}
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      value={row.sku}
                      onChange={(e) => updateRow(index, "sku", e.target.value)}
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={row.stock}
                      onChange={(e) => updateRow(index, "stock", e.target.value)}
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Supprimer la variante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { name: "", price: "", compareAtPrice: "", sku: "", stock: "0" },
            ])
          }
          className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
        >
          <Plus className="h-4 w-4" />
          Ajouter une variante
        </button>
      </div>

      <Button type="submit" variant="secondary" size="sm">
        Enregistrer les variantes
      </Button>
    </form>
  );
}
