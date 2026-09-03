import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request, "products:read");
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const supabase = createClient();
  const { data, error } = await supabase.rpc("api_list_products", {
    p_organization_id: auth.organizationId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
