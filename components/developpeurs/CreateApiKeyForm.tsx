"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createApiKey, type CreateApiKeyState } from "@/lib/actions/apiKeys";
import { AVAILABLE_SCOPES } from "@/lib/apiScopes";

const SCOPE_LABELS: Record<string, string> = {
  "products:read": "Lecture des produits",
  "orders:read": "Lecture des commandes",
};

const initialState: CreateApiKeyState = { key: null, error: null };

export function CreateApiKeyForm() {
  const [state, formAction] = useFormState(createApiKey, initialState);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!state.key) return;
    try {
      await navigator.clipboard.writeText(state.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible : la clé reste affichée à copier manuellement.
    }
  }

  if (state.key) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Copiez cette clé maintenant — elle ne sera plus jamais affichée.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-white px-2 py-1.5 text-xs text-slate-700">
            {state.key}
          </code>
          <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nom
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Ex. Intégration Zapier"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">Permissions</p>
        <div className="mt-2 space-y-2">
          {AVAILABLE_SCOPES.map((scope) => (
            <label key={scope} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={`scope_${scope}`}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              {SCOPE_LABELS[scope] ?? scope}
            </label>
          ))}
        </div>
      </div>
      <SubmitButton pendingText="Création...">Créer la clé</SubmitButton>
    </form>
  );
}
