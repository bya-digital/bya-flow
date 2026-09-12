"use server";

import { aiProvider } from "@/lib/ai";
import { getAssistantContext } from "@/lib/data/assistantContext";

export async function askAssistant(message: string): Promise<string> {
  if (!message?.trim()) return "";

  const context = await getAssistantContext();
  if (!context) {
    return "Terminez d'abord la configuration de votre boutique pour utiliser l'assistant.";
  }

  return aiProvider.chat(message, context);
}
