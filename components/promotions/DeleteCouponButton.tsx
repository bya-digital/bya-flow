"use client";

import { Trash2 } from "lucide-react";
import { deleteCoupon } from "@/lib/actions/coupons";

export function DeleteCouponButton({ couponId }: { couponId: string }) {
  return (
    <form
      action={deleteCoupon}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement ce coupon ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="couponId" value={couponId} />
      <button
        type="submit"
        className="text-slate-400 hover:text-red-600"
        aria-label="Supprimer le coupon"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
