"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { completeOnboarding } from "@/lib/actions/onboarding";

const BUSINESS_TYPES = [
  { value: "ecommerce", label: "Boutique en ligne" },
  { value: "services", label: "Services" },
  { value: "infopreneur", label: "Infopreneur / formation" },
  { value: "artisanat", label: "Artisanat / fait-main" },
  { value: "autre", label: "Autre" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CAD", "XOF", "XAF", "CHF"];

const GOALS = [
  { value: "vendre_plus", label: "Vendre plus" },
  { value: "trouver_clients", label: "Trouver plus de clients" },
  { value: "automatiser_marketing", label: "Automatiser mon marketing" },
  { value: "ameliorer_conversions", label: "Améliorer mes conversions" },
  { value: "developper_boutique", label: "Développer ma boutique" },
];

const STEPS = ["Entreprise", "Activité", "Devise", "Pays", "Objectif", "Boutique"];

interface FormState {
  companyName: string;
  businessType: string;
  currency: string;
  country: string;
  primaryGoal: string;
  storeName: string;
}

const inputClasses =
  "mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

export function OnboardingWizard({ error }: { error?: string }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>({
    companyName: "",
    businessType: "",
    currency: "EUR",
    country: "",
    primaryGoal: "",
    storeName: "",
  });

  const update = (field: keyof FormState, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const isLastStep = step === STEPS.length - 1;

  const canGoNext = (() => {
    switch (step) {
      case 0:
        return data.companyName.trim().length > 0;
      case 1:
        return data.businessType.length > 0;
      case 2:
        return data.currency.length > 0;
      case 3:
        return data.country.trim().length > 0;
      case 4:
        return data.primaryGoal.length > 0;
      default:
        return true;
    }
  })();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          Étape {step + 1} / {STEPS.length} — {STEPS[step]}
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-brand-600 transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Une erreur est survenue" description={error} />
        </div>
      )}

      <form action={completeOnboarding} className="space-y-5">
        <input type="hidden" name="companyName" value={data.companyName} />
        <input type="hidden" name="businessType" value={data.businessType} />
        <input type="hidden" name="currency" value={data.currency} />
        <input type="hidden" name="country" value={data.country} />
        <input type="hidden" name="primaryGoal" value={data.primaryGoal} />
        <input type="hidden" name="storeName" value={data.storeName} />

        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Nom de votre entreprise</h2>
            <p className="mt-1 text-sm text-slate-500">
              Comment s&apos;appelle votre activité ?
            </p>
            <input
              autoFocus
              value={data.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="Ex. Atelier Claire"
              className={inputClasses}
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Type d&apos;activité</h2>
            <p className="mt-1 text-sm text-slate-500">Choisissez ce qui correspond le mieux.</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BUSINESS_TYPES.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => update("businessType", type.value)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    data.businessType === type.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Devise principale</h2>
            <p className="mt-1 text-sm text-slate-500">
              Dans quelle devise facturez-vous vos clients ?
            </p>
            <select
              value={data.currency}
              onChange={(e) => update("currency", e.target.value)}
              className={inputClasses}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pays</h2>
            <p className="mt-1 text-sm text-slate-500">Où est basée votre activité ?</p>
            <input
              autoFocus
              value={data.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="Ex. France"
              className={inputClasses}
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Objectif principal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Qu&apos;attendez-vous en priorité de BYA Flow ?
            </p>
            <div className="mt-4 space-y-2">
              {GOALS.map((goal) => (
                <button
                  type="button"
                  key={goal.value}
                  onClick={() => update("primaryGoal", goal.value)}
                  className={`block w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    data.primaryGoal === goal.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Votre première boutique</h2>
            <p className="mt-1 text-sm text-slate-500">
              Vous pourrez en créer d&apos;autres et la personnaliser plus tard.
            </p>
            <input
              autoFocus
              value={data.storeName}
              onChange={(e) => update("storeName", e.target.value)}
              placeholder={data.companyName || "Nom de la boutique"}
              className={inputClasses}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Précédent
          </Button>

          {isLastStep ? (
            <Button type="submit">Terminer</Button>
          ) : (
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canGoNext}>
              Suivant
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
