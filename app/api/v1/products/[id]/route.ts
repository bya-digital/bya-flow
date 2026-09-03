import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApiRequest(request, "products:read");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("api_get_product", { p_organization_id: auth.organizationId, p_product_id: params.id })
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  return NextResponse.json({ data });
}
