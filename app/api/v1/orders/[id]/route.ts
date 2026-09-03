import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApiRequest(request, "orders:read");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createClient();
  const [{ data: order, error }, { data: items }] = await Promise.all([
    supabase
      .rpc("api_get_order", { p_organization_id: auth.organizationId, p_order_id: params.id })
      .maybeSingle(),
    supabase.rpc("api_get_order_items", {
      p_organization_id: auth.organizationId,
      p_order_id: params.id,
    }),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ data: { ...order, items: items ?? [] } });
}
