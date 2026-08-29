"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { changePlan } from "@/lib/actions/billing";
import { formatLimit, type Plan } from "@/lib/billing/plans";

export function PlanCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-5 ${
        isCurrent ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"
      }`}
    >
      <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {plan.price === 0 ? "Gratuit" : `${plan.price} €`}
        {plan.price > 0 && <span className="text-sm font-normal text-slate-500"> / mois</span>}
      </p>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-600" />
          {formatLimit(plan.maxProducts)} produits
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-600" />
          {formatLimit(plan.maxOrdersPerMonth)} commandes / mois
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-brand-600" />
          {formatLimit(plan.maxTeamMembers)} membre(s) d&apos;équipe
        </li>
      </ul>

      <div className="mt-5">
        {isCurrent ? (
          <span className="block rounded-lg bg-brand-100 px-4 py-2 text-center text-sm font-semibold text-brand-700">
            Plan actuel
          </span>
        ) : (
          <form
            action={changePlan}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  `Passer au plan ${plan.name} ? Aucun moyen de paiement n'est connecté : ce changement est immédiat et gratuit.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="plan" value={plan.id} />
            <Button type="submit" variant="secondary" className="w-full">
              Choisir ce plan
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
