"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

const TRIGGER_OPTIONS = [
  { value: "order_created", label: "Une commande est créée", placeholders: "{{order_number}}" },
  { value: "order_delivered", label: "Une commande est livrée", placeholders: "{{order_number}}" },
  { value: "cart_abandoned", label: "Un panier est marqué abandonné", placeholders: "{{customer_name}}" },
  {
    value: "customer_inactive",
    label: "Un client est inactif depuis N jours",
    placeholders: "{{customer_name}}, {{days}}",
  },
];

export interface AutomationFormValues {
  id?: string;
  name: string;
  trigger_type: string;
  trigger_config: { days?: number };
  action_title: string;
  action_message: string;
  is_active: boolean;
}

export function AutomationForm({
  action,
  automation,
}: {
  action: (formData: FormData) => void;
  automation?: AutomationFormValues;
}) {
  const [triggerType, setTriggerType] = useState(automation?.trigger_type ?? "order_created");
  const selectedTrigger = TRIGGER_OPTIONS.find((t) => t.value === triggerType);

  return (
    <form action={action} className="space-y-5">
      {automation?.id && <input type="hidden" name="automationId" value={automation.id} />}

      <div>
        <label htmlFor="name" className={labelClasses}>
          Nom de l&apos;automatisation
        </label>
        <input
          id="name"
          name="name"
          defaultValue={automation?.name ?? ""}
          required
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="triggerType" className={labelClasses}>
          Déclencheur
        </label>
        <select
          id="triggerType"
          name="triggerType"
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
          className={inputClasses}
        >
          {TRIGGER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {triggerType === "customer_inactive" && (
        <div>
          <label htmlFor="days" className={labelClasses}>
            Nombre de jours d&apos;inactivité
          </label>
          <input
            id="days"
            name="days"
            type="number"
            min="1"
            defaultValue={automation?.trigger_config?.days ?? 60}
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-slate-400">
            Ce déclencheur n&apos;est pas encore automatique : lancez la vérification
            manuellement depuis la fiche de l&apos;automatisation.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className={labelClasses}>Action : créer une notification interne</p>
        <p className="mt-1 text-xs text-slate-500">
          Aucun fournisseur email/SMS n&apos;est connecté : l&apos;action crée une
          notification visible dans BYA Flow, elle n&apos;envoie rien à l&apos;extérieur.
          Variables disponibles : {selectedTrigger?.placeholders}
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="actionTitle" className="text-xs font-medium text-slate-600">
              Titre
            </label>
            <input
              id="actionTitle"
              name="actionTitle"
              defaultValue={automation?.action_title ?? ""}
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="actionMessage" className="text-xs font-medium text-slate-600">
              Message
            </label>
            <textarea
              id="actionMessage"
              name="actionMessage"
              defaultValue={automation?.action_message ?? ""}
              required
              rows={3}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={automation?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
        />
        Active
      </label>

      <Button type="submit">{automation?.id ? "Enregistrer" : "Créer l'automatisation"}</Button>
    </form>
  );
}
