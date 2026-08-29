import { heuristicProvider } from "@/lib/ai/providers/heuristicProvider";
import type { AIProvider } from "@/lib/ai/types";

// Fournisseur IA actif de l'application. Pour connecter un vrai
// fournisseur (OpenAI, Anthropic...) : créer une nouvelle classe dans
// lib/ai/providers/ qui implémente `AIProvider`, puis la brancher ici.
// Aucun autre fichier de l'application n'a besoin de changer.
export const aiProvider: AIProvider = heuristicProvider;

export type { AIProvider, ProductDescriptionInput, CampaignContentInput, CampaignContentOutput } from "@/lib/ai/types";
