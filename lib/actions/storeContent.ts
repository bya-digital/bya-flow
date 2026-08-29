"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

// Témoignages

export async function createTestimonial(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase.from("store_testimonials").insert({
    store_id: store.id,
    author_name: formData.get("authorName") as string,
    quote: formData.get("quote") as string,
    is_active: formData.get("isActive") === "on",
  });

  if (error) {
    redirect(`/boutique/temoignages/nouveau?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/boutique/temoignages");
  revalidatePath(`/store/${store.slug}`);
  redirect("/boutique/temoignages");
}

export async function updateTestimonial(formData: FormData) {
  const testimonialId = formData.get("testimonialId") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase
    .from("store_testimonials")
    .update({
      author_name: formData.get("authorName") as string,
      quote: formData.get("quote") as string,
      is_active: formData.get("isActive") === "on",
    })
    .eq("id", testimonialId);

  if (error) {
    redirect(`/boutique/temoignages/${testimonialId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/boutique/temoignages");
  revalidatePath(`/store/${store.slug}`);
  redirect("/boutique/temoignages?success=1");
}

export async function deleteTestimonial(formData: FormData) {
  const testimonialId = formData.get("testimonialId") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase.from("store_testimonials").delete().eq("id", testimonialId);

  if (error) {
    redirect(`/boutique/temoignages?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/boutique/temoignages");
  revalidatePath(`/store/${store.slug}`);
  redirect("/boutique/temoignages");
}

// FAQ

export async function createFaq(formData: FormData) {
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase.from("store_faqs").insert({
    store_id: store.id,
    question: formData.get("question") as string,
    answer: formData.get("answer") as string,
    is_active: formData.get("isActive") === "on",
  });

  if (error) {
    redirect(`/boutique/faq/nouveau?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/boutique/faq");
  revalidatePath(`/store/${store.slug}`);
  redirect("/boutique/faq");
}

export async function updateFaq(formData: FormData) {
  const faqId = formData.get("faqId") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase
    .from("store_faqs")
    .update({
      question: formData.get("question") as string,
      answer: formData.get("answer") as string,
      is_active: formData.get("isActive") === "on",
    })
    .eq("id", faqId);

  if (error) {
    redirect(`/boutique/faq/${faqId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/boutique/faq");
  revalidatePath(`/store/${store.slug}`);
  redirect("/boutique/faq?success=1");
}

export async function deleteFaq(formData: FormData) {
  const faqId = formData.get("faqId") as string;
  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const supabase = createClient();
  const { error } = await supabase.from("store_faqs").delete().eq("id", faqId);

  if (error) {
    redirect(`/boutique/faq?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/boutique/faq");
  revalidatePath(`/store/${store.slug}`);
  redirect("/boutique/faq");
}
