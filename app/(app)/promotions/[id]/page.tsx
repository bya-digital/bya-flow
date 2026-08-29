import { notFound } from "next/navigation";
import { CouponForm } from "@/components/promotions/CouponForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";
import { updateCoupon } from "@/lib/actions/coupons";
import { createClient } from "@/lib/supabase/server";

export default async function CouponDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const store = await getCurrentStore();
  if (!store) notFound();

  const supabase = createClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!coupon) notFound();

  return (
    <>
      <PageHeader title={coupon.code} description="Modifier le coupon." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <CouponForm action={updateCoupon} coupon={coupon} />
        </CardContent>
      </Card>
    </>
  );
}
