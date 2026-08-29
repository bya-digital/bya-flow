import { Heart } from "lucide-react";
import { toggleWishlist } from "@/lib/actions/wishlist";

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
      <button
        type="submit"
        aria-label={isActive ? "Retirer des favoris" : "Ajouter aux favoris"}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
      >
        <Heart
          className={isActive ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4 text-slate-500"}
        />
      </button>
    </form>
  );
}
