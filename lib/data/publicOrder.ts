import { createClient } from "@/lib/supabase/server";

export interface PublicOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  productType: "physical" | "digital" | "course";
}

interface ShippingAddress {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface PublicOrder {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingMethodName: string | null;
  shippingCost: number;
  total: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  loyaltyDiscount: number;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  createdAt: string;
  items: PublicOrderItem[];
}

export async function getPublicOrder(orderId: string): Promise<PublicOrder | null> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, subtotal, shipping_method_name, shipping_cost, total, loyalty_points_earned, loyalty_points_redeemed, loyalty_discount, shipping_address, notes, created_at"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const [{ data: items }, { data: itemTypes }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, product_id, quantity, unit_price, products(name)")
      .eq("order_id", orderId),
    // Jamais via products_select_public (limitée à status='active') :
    // un acheteur doit toujours voir/retélécharger un produit numérique
    // même dépublié depuis par le marchand.
    supabase.rpc("get_order_item_product_types", { p_order_id: orderId }),
  ]);
  const productTypeByItem = new Map(
    (itemTypes ?? []).map((row: { order_item_id: string; product_type: string }) => [
      row.order_item_id,
      row.product_type,
    ])
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    subtotal: Number(order.subtotal),
    shippingMethodName: order.shipping_method_name,
    shippingCost: Number(order.shipping_cost),
    total: Number(order.total),
    loyaltyPointsEarned: order.loyalty_points_earned,
    loyaltyPointsRedeemed: order.loyalty_points_redeemed,
    loyaltyDiscount: Number(order.loyalty_discount),
    shippingAddress: order.shipping_address as ShippingAddress | null,
    notes: order.notes,
    createdAt: order.created_at,
    items: (items ?? []).map((item) => {
      const product = item.products as unknown as { name: string } | null;
      const productType = productTypeByItem.get(item.id);
      return {
        id: item.id,
        productId: item.product_id,
        productName: product?.name ?? "Produit",
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        productType:
          productType === "digital" || productType === "course" ? productType : "physical",
      };
    }),
  };
}
