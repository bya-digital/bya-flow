import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
}

export function TopProducts({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucune vente enregistrée"
        description="Les produits les plus vendus apparaîtront ici dès votre première commande."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {products.map((product, index) => (
        <li key={product.id} className="flex items-center justify-between py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
              {index + 1}
            </span>
            <span className="font-medium text-slate-900">{product.name}</span>
          </div>
          <span className="text-slate-500">
            {product.quantity} vendus
            {product.revenue !== undefined && ` · ${product.revenue.toFixed(2)} €`}
          </span>
        </li>
      ))}
    </ul>
  );
}
