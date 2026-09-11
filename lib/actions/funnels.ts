"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export async function createFunnel(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const name = formData.get("name") as string;
  const supabase = createClient();

  const { data: funnel, error } = await supabase
    .from("funnels")
    .insert({ store_id: store.id, name })
    .select("id")
    .single<{ id: string }>();

  if (error || !funnel) {
    redirect(`/funnels?error=${encodeURIComponent(error?.message ?? "Erreur lors de la création.")}`);
    return;
  }

  revalidatePath("/funnels");
  redirect(`/funnels/${funnel.id}`);
}

export async function deleteFunnel(formData: FormData) {
  const funnelId = formData.get("funnelId") as string;
  const supabase = createClient();

  const { error } = await supabase.from("funnels").delete().eq("id", funnelId);

  if (error) {
    redirect(`/funnels?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath("/funnels");
  redirect("/funnels");
}

export async function addFunnelStep(formData: FormData) {
  const funnelId = formData.get("funnelId") as string;
  const stepType = formData.get("stepType") as string;
  const refId = formData.get("refId") as string;
  const label = (formData.get("label") as string) || null;

  if (!refId) {
    redirect(`/funnels/${funnelId}?error=${encodeURIComponent("Choisissez une page ou un produit.")}`);
    return;
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("funnel_steps")
    .select("position")
    .eq("funnel_id", funnelId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from("funnel_steps").insert({
    funnel_id: funnelId,
    position: nextPosition,
    step_type: stepType === "product" ? "product" : "page",
    page_id: stepType === "page" ? refId : null,
    product_id: stepType === "product" ? refId : null,
    label,
  });

  if (error) {
    redirect(`/funnels/${funnelId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/funnels/${funnelId}`);
  redirect(`/funnels/${funnelId}`);
}

export async function removeFunnelStep(formData: FormData) {
  const stepId = formData.get("stepId") as string;
  const funnelId = formData.get("funnelId") as string;
  const supabase = createClient();

  const { error } = await supabase.from("funnel_steps").delete().eq("id", stepId);

  if (error) {
    redirect(`/funnels/${funnelId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/funnels/${funnelId}`);
  redirect(`/funnels/${funnelId}`);
}

export async function moveFunnelStep(formData: FormData) {
  const funnelId = formData.get("funnelId") as string;
  const stepId = formData.get("stepId") as string;
  const direction = formData.get("direction") as string;
  const supabase = createClient();

  const { data: steps } = await supabase
    .from("funnel_steps")
    .select("id, position")
    .eq("funnel_id", funnelId)
    .order("position", { ascending: true });

  if (!steps) {
    redirect(`/funnels/${funnelId}`);
    return;
  }

  const index = steps.findIndex((s) => s.id === stepId);
  const swapWith = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapWith < 0 || swapWith >= steps.length) {
    redirect(`/funnels/${funnelId}`);
    return;
  }

  await supabase.from("funnel_steps").update({ position: steps[swapWith].position }).eq("id", steps[index].id);
  await supabase.from("funnel_steps").update({ position: steps[index].position }).eq("id", steps[swapWith].id);

  revalidatePath(`/funnels/${funnelId}`);
  redirect(`/funnels/${funnelId}`);
}
