import { Package } from "lucide-react";
import Link from "next/link";
import type { PublicProductSummary } from "@/lib/data/publicStore";

export function RelatedProducts({
  products,
  basedOnPurchases,
  storeSlug,
  currency,
}: {
  products: PublicProductSummary[];
  basedOnPurchases: boolean;
  storeSlug: string;
  currency: string;
}) {
  if (products.length === 0) return null;

  const currencyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency });

  return (
    <div className="mt-16 max-w-5xl">
      <h2 className="text-xl font-bold text-slate-900">
        {basedOnPurchases ? "Souvent achetés ensemble" : "Vous pourriez aussi aimer"}
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/store/${storeSlug}/produits/${product.slug}`}
            className="group"
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900 group-hover:text-brand-600">
              {product.name}
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {currencyFormatter.format(product.price)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
