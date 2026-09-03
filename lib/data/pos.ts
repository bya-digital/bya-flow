import { createClient } from "@/lib/supabase/server";

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string | null;
  imageUrl: string | null;
}

interface ProductImageRow {
  url: string;
  position: number;
}

export async function getPosProducts(storeId: string): Promise<PosProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, price, stock, sku, product_images(url, position)")
    .eq("store_id", storeId)
    .eq("status", "active")
    .gt("stock", 0)
    .order("name", { ascending: true });

  return (data ?? []).map((product) => {
    const images = (product.product_images as ProductImageRow[] | null) ?? [];
    const sorted = images.slice().sort((a, b) => a.position - b.position);
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      stock: product.stock,
      sku: product.sku,
      imageUrl: sorted[0]?.url ?? null,
    };
  });
}

export interface PosOrderReceipt {
  id: string;
  orderNumber: number;
  createdAt: string;
  subtotal: number;
  total: number;
  paymentMethod: string | null;
  customerName: string | null;
  items: { productName: string; quantity: number; unitPrice: number }[];
}

export async function getPosOrderReceipt(orderId: string): Promise<PosOrderReceipt | null> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, created_at, subtotal, total, payment_method, customers(full_name)")
    .eq("id", orderId)
    .eq("channel", "pos")
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, unit_price, products(name)")
    .eq("order_id", orderId);

  return {
    id: order.id,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    paymentMethod: order.payment_method,
    customerName: (order.customers as unknown as { full_name: string } | null)?.full_name ?? null,
    items: (items ?? []).map((item) => ({
      productName: (item.products as unknown as { name: string } | null)?.name ?? "Produit",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    })),
  };
}
