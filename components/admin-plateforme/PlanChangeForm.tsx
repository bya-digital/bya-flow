"use client";

import { PLANS } from "@/lib/billing/plans";
import { updateOrganizationPlan } from "@/lib/actions/platformAdmin";

export function PlanChangeForm({
  organizationId,
  currentPlan,
}: {
  organizationId: string;
  currentPlan: string;
}) {
  return (
    <form action={updateOrganizationPlan} className="flex items-center gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <select
        name="plan"
        defaultValue={currentPlan}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      >
        {PLANS.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
      >
        Changer
      </button>
    </form>
  );
}
