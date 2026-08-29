import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { savePaymentProvider } from "@/lib/actions/payments";
import type { PaymentProvider } from "@/lib/payments/types";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export function PaymentProviderCard({
  provider,
  isConfigured,
  isActive,
}: {
  provider: PaymentProvider;
  isConfigured: boolean;
  isActive: boolean;
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

        {provider.fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`${provider.id}-${field.key}`} className={labelClasses}>
              {field.label}
            </label>
            <input
              id={`${provider.id}-${field.key}`}
              name={field.key}
              type="password"
              placeholder={isConfigured ? "••••••••" : ""}
              className={inputClasses}
            />
          </div>
        ))}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={isActive}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
          />
          Actif
        </label>

        <Button type="submit">Enregistrer</Button>
      </form>
    </div>
  );
}
