"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signupCustomer(formData: FormData) {
  const storeSlug = formData.get("storeSlug") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const signupUrl = `/store/${storeSlug}/compte/inscription`;

  if (password !== confirmPassword) {
    redirect(
      `${signupUrl}?error=${encodeURIComponent("Les mots de passe ne correspondent pas.")}`
    );
    return;
  }

  const origin =
    headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        `/store/${storeSlug}/compte`
      )}`,
    },
  });

  if (error) {
    redirect(`${signupUrl}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  if (!data.session) {
    redirect(
      `${signupUrl}?message=${encodeURIComponent(
        "Vérifiez votre boîte mail pour confirmer votre compte."
      )}`
    );
    return;
  }

  redirect(`/store/${storeSlug}/compte`);
}

export async function loginCustomer(formData: FormData) {
  const storeSlug = formData.get("storeSlug") as string;
  const storeId = formData.get("storeId") as string;
  const previousCartId = (formData.get("previousCartId") as string) || null;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const loginUrl = `/store/${storeSlug}/compte/connexion`;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`${loginUrl}?error=${encodeURIComponent("Email ou mot de passe incorrect.")}`);
    return;
  }

  if (previousCartId) {
    await supabase.rpc("merge_cart", {
      p_store_id: storeId,
      p_previous_cart_id: previousCartId,
    });
  }

  redirect(`/store/${storeSlug}/compte`);
}

export async function logoutCustomer(formData: FormData) {
  const storeSlug = formData.get("storeSlug") as string;
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect(`/store/${storeSlug}`);
}
