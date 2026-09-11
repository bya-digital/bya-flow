import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { savePaymentProvider } from "@/lib/actions/payments";
import { cn } from "@/lib/utils";
import type { PaymentProvider } from "@/lib/payments/types";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export function PaymentProviderCard({
  provider,
  isConfigured,
  isActive,
  // Uniquement les champs non sensibles (ex. "sandbox") — jamais un
  // secret : ce composant est rendu côté client, tout ce qui arrive ici
  // finit dans le bundle envoyé au navigateur.
  nonSecretConfig = {},
  // Un simple membre peut voir l'état (configuré/actif) mais jamais
  // modifier les clés API du compte de paiement du marchand — appliqué
  // aussi côté serveur (savePaymentProvider) et RLS, jamais uniquement ici.
  canManage,
}: {
  provider: PaymentProvider;
  isConfigured: boolean;
  isActive: boolean;
  nonSecretConfig?: Record<string, string>;
  canManage: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{provider.name}</h3>
        <div className="flex gap-2">
          <Badge tone={isConfigured ? "success" : "neutral"}>
            {isConfigured ? "Configuré" : "Non configuré"}
          </Badge>
          <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Actif" : "Inactif"}</Badge>
        </div>
      </div>

      <form action={savePaymentProvider} className="mt-4 space-y-3">
        <input type="hidden" name="providerId" value={provider.id} />

        {provider.fields.map((field) =>
          field.type === "checkbox" ? (
            <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={field.key}
                defaultChecked={nonSecretConfig[field.key] === "true"}
                disabled={!canManage}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400 disabled:opacity-50"
              />
              {field.label}
            </label>
          ) : (
            <div key={field.key}>
              <label htmlFor={`${provider.id}-${field.key}`} className={labelClasses}>
                {field.label}
              </label>
              <input
                id={`${provider.id}-${field.key}`}
                name={field.key}
                type="password"
                placeholder={isConfigured ? "••••••••" : ""}
                disabled={!canManage}
                className={cn(inputClasses, "disabled:bg-slate-50 disabled:text-slate-400")}
              />
            </div>
          )
        )}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={isActive}
            disabled={!canManage}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400 disabled:opacity-50"
          />
          Actif
        </label>

        {canManage ? (
          <Button type="submit">Enregistrer</Button>
        ) : (
          <p className="text-xs text-slate-400">
            Réservé aux administrateurs de la boutique.
          </p>
        )}
      </form>
    </div>
  );
}
