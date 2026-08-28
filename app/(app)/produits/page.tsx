import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "success" | "warning" }> = {
  draft: { label: "Brouillon", tone: "warning" },
  active: { label: "Actif", tone: "success" },
  archived: { label: "Archivé", tone: "neutral" },
};

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  status: string;
  product_images: { url: string }[];
}

export default async function ProduitsPage() {
  const store = await getCurrentStore();

  let products: ProductRow[] = [];

  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, price, stock, status, product_images(url)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    products = (data ?? []) as unknown as ProductRow[];
  }

  return (
    <>
      <PageHeader
        title="Produits"
        description="Catalogue produits, variantes, stock et prix."
        action={
          <Link
            href="/produits/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit"
          description="Ajoutez votre premier produit pour commencer à vendre."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const status = STATUS_LABELS[product.status] ?? STATUS_LABELS.draft;
                const thumbnail = product.product_images?.[0]?.url;
                return (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/produits/${product.id}`}
                        className="flex items-center gap-3 font-medium text-slate-900 hover:text-brand-600"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-slate-300" />
                          )}
                        </span>
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{product.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{Number(product.price).toFixed(2)} €</td>
                    <td className="px-4 py-3 text-slate-500">{product.stock}</td>
                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
