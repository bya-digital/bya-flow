"use server";

import { aiProvider } from "@/lib/ai";

export async function generateProductDescription(input: {
  name: string;
  category?: string | null;
  price?: number | null;
  currency?: string;
}) {
  if (!input.name?.trim()) return "";
  return aiProvider.generateProductDescription(input);
}

export async function generateCampaignContent(input: {
  name: string;
  channel: string;
  goal?: string | null;
}) {
  if (!input.name?.trim()) return { subject: "", content: "" };
  return aiProvider.generateCampaignContent(input);
}
