import { CouponForm } from "@/components/promotions/CouponForm";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { createCoupon } from "@/lib/actions/coupons";

export default function NouveauCouponPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <PageHeader title="Nouveau coupon" description="Créez un code promo pour vos clients." />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}

      <Card className="max-w-2xl">
        <CardContent>
          <CouponForm action={createCoupon} />
        </CardContent>
      </Card>
    </>
  );
}
