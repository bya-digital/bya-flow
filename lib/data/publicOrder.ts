import { createClient } from "@/lib/supabase/server";

export interface PublicOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
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

  const { data: items } = await supabase
    .from("order_items")
    .select("id, quantity, unit_price, products(name)")
    .eq("order_id", orderId);

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
    items: (items ?? []).map((item) => ({
      id: item.id,
      productName: (item.products as unknown as { name: string } | null)?.name ?? "Produit",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    })),
  };
}
