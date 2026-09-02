"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "/dashboard";

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({ error: error.message });
    if (redirectTo !== "/dashboard") params.set("redirect", redirectTo);
    redirect(`/login?${params.toString()}`);
  }

  redirect(redirectTo);
}

export async function signUp(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const redirectTo = (formData.get("redirect") as string) || "/onboarding";
  const redirectParam = redirectTo !== "/onboarding" ? `&redirect=${encodeURIComponent(redirectTo)}` : "";

  if (password !== confirmPassword) {
    redirect(
      `/signup?error=${encodeURIComponent("Les mots de passe ne correspondent pas.")}${redirectParam}`
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}${redirectParam}`);
  }

  if (!data.session) {
    redirect(
      `/signup?message=${encodeURIComponent(
        "Vérifiez votre boîte mail pour confirmer votre compte."
      )}${redirectParam}`
    );
  }

  redirect(redirectTo);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  const origin =
    headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  // Message générique volontaire : ne pas révéler si l'email existe ou non.
  redirect(
    `/forgot-password?message=${encodeURIComponent(
      "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé."
    )}`
  );
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  // Réutilisée par /reset-password (lien reçu par email) ET par le
  // formulaire "changer mon mot de passe" de /parametres et du compte
  // client — chacun indique où revenir via ces deux champs cachés.
  const redirectTo = (formData.get("redirect") as string) || "/dashboard";
  const errorRedirect = (formData.get("errorRedirect") as string) || "/reset-password";

  if (password !== confirmPassword) {
    redirect(
      `${errorRedirect}?error=${encodeURIComponent("Les mots de passe ne correspondent pas.")}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`${errorRedirect}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}success=password`);
}

export async function updateEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const redirectTo = (formData.get("redirect") as string) || "/parametres";
  const errorRedirect = (formData.get("errorRedirect") as string) || redirectTo;
  const origin =
    headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = createClient();
  // Supabase envoie une confirmation à la nouvelle adresse (et, selon le
  // réglage "Secure email change" du projet, aussi à l'ancienne) avant que
  // le changement ne prenne effet — rien à faire de plus ici, /auth/callback
  // gère déjà l'échange du lien de confirmation, quel que soit son type.
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` }
  );

  if (error) {
    redirect(`${errorRedirect}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `${errorRedirect}?message=${encodeURIComponent(
      "Vérifiez votre nouvelle adresse email pour confirmer le changement."
    )}`
  );
}
