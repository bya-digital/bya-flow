"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

function readCustomerFields(formData: FormData) {
  const tagsInput = (formData.get("tags") as string) || "";
  return {
    full_name: formData.get("fullName") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    status: (formData.get("status") as string) || "prospect",
    notes: (formData.get("notes") as string) || null,
    tags: tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

export async function createCustomer(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const redirectTo = (formData.get("redirectTo") as string) || null;

  const supabase = createClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .insert({ organization_id: store.organization_id, ...readCustomerFields(formData) })
    .select("id")
    .single<{ id: string }>();

  if (error || !customer) {
    redirect(
      `/clients/nouveau?error=${encodeURIComponent(
        error?.message ?? "Erreur lors de la création."
      )}`
    );
    return;
  }

  revalidatePath("/clients");

  if (redirectTo) {
    redirect(`${redirectTo}?newCustomerId=${customer.id}`);
  }
  redirect(`/clients/${customer.id}`);
}

export async function updateCustomer(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .update(readCustomerFields(formData))
    .eq("id", customerId);

  if (error) {
    redirect(`/clients/${customerId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
  redirect(`/clients/${customerId}?success=1`);
}

export async function deleteCustomer(formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const supabase = createClient();
  const { error } = await supabase.from("customers").delete().eq("id", customerId);

  if (error) {
    redirect(`/clients/${customerId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clients");
  redirect("/clients");
}
