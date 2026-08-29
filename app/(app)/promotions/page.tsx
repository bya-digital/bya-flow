import { Plus, Ticket } from "lucide-react";
import Link from "next/link";
import { DeleteCouponButton } from "@/components/promotions/DeleteCouponButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

interface CouponRow {
  id: string;
  code: string;
  type: string;
  value: number;
  usage_count: number;
  usage_limit: number | null;
  is_active: boolean;
}

export default async function PromotionsPage() {
  const store = await getCurrentStore();

  let coupons: CouponRow[] = [];

  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("coupons")
      .select("id, code, type, value, usage_count, usage_limit, is_active")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    coupons = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Promotions & coupons"
        description="Codes promo, remises et offres."
        action={
          <Link
            href="/promotions/nouveau"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau coupon
          </Link>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Aucun coupon"
          description="Créez un code promo à appliquer sur vos commandes."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Remise</th>
                <th className="px-4 py-3">Utilisation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/promotions/${coupon.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {coupon.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {coupon.type === "percentage" ? `${coupon.value} %` : `${coupon.value} €`}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {coupon.usage_count} / {coupon.usage_limit ?? "∞"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={coupon.is_active ? "success" : "neutral"}>
                      {coupon.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DeleteCouponButton couponId={coupon.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
