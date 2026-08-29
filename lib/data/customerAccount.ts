import { createClient } from "@/lib/supabase/server";

export interface CustomerSession {
  isLoggedIn: boolean;
  email: string | null;
  fullName: string | null;
}

export async function getCustomerSession(): Promise<CustomerSession> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { isLoggedIn: false, email: null, fullName: null };
  }

  return {
    isLoggedIn: true,
    email: user.email,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

export async function getCustomerOrders(storeId: string): Promise<CustomerOrderSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    createdAt: order.created_at,
  }));
}
