"use client";

import { Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createPosSale } from "@/lib/actions/pos";
import type { PosProduct } from "@/lib/data/pos";

interface CartLine {
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-xs font-medium text-slate-500";

export function PosTerminal({
  products,
  currency,
}: {
  products: PosProduct[];
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR", { style: "currency", currency }),
    [currency]
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) || product.sku?.toLowerCase().includes(q)
    );
  }, [products, query]);

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  function addToCart(product: PosProduct) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      if (product.stock <= 0) return current;
      return [
        ...current,
        { productId: product.id, name: product.name, price: product.price, stock: product.stock, quantity: 1 },
      ];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(Math.max(line.quantity + delta, 0), line.stock) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((current) => current.filter((line) => line.productId !== productId));
  }

  const itemsPayload = JSON.stringify(
    cart.map((line) => ({ product_id: line.productId, quantity: line.quantity }))
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit (nom, SKU)..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Aucun produit disponible.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="flex flex-col items-start gap-1 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-sm font-medium text-slate-900">{product.name}</span>
                <span className="text-sm text-slate-500">{currencyFormatter.format(product.price)}</span>
                <span className="text-xs text-slate-400">{product.stock} en stock</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ShoppingBag className="h-4 w-4" /> Vente en cours
        </h2>

        {cart.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Ajoutez des produits depuis la liste.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {cart.map((line) => (
              <li key={line.productId} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{line.name}</p>
                  <p className="text-xs text-slate-500">
                    {currencyFormatter.format(line.price)} × {line.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.productId, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.productId, 1)}
                    disabled={line.quantity >= line.stock}
                    className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    className="ml-1 text-slate-400 hover:text-red-600"
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-semibold text-slate-900">Total</span>
          <span className="text-lg font-bold text-slate-900">{currencyFormatter.format(total)}</span>
        </div>

        <form action={createPosSale} className="mt-4 space-y-3">
          <input type="hidden" name="items" value={itemsPayload} />

          <div>
            <label className={labelClasses}>Mode de paiement</label>
            <select
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={inputClasses}
            >
              <option value="cash">Espèces</option>
              <option value="card">Carte</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-xs font-medium text-brand-600">
              Associer un client (optionnel)
            </summary>
            <div className="mt-2 space-y-2">
              <input name="customerName" placeholder="Nom" className={inputClasses} />
              <input name="customerEmail" type="email" placeholder="Email" className={inputClasses} />
              <input name="customerPhone" placeholder="Téléphone" className={inputClasses} />
            </div>
          </details>

          <SubmitButton
            pendingText="Encaissement..."
            disabled={cart.length === 0}
            className="w-full"
          >
            Encaisser {cart.length > 0 ? currencyFormatter.format(total) : ""}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
