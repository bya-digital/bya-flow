import { toggleWishlist } from "@/lib/actions/wishlist";
import { WishlistToggleButton } from "@/components/store/WishlistToggleButton";

export function WishlistButton({
  storeId,
  storeSlug,
  productId,
  isActive,
  returnTo,
  className,
}: {
  storeId: string;
  storeSlug: string;
  productId: string;
  isActive: boolean;
  returnTo?: string;
  className?: string;
}) {
  return (
    <form action={toggleWishlist} className={className}>
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="storeSlug" value={storeSlug} />
      <input type="hidden" name="productId" value={productId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <WishlistToggleButton isActive={isActive} />
    </form>
  );
}
