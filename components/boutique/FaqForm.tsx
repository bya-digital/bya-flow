"use client";

import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export interface FaqFormValues {
  id?: string;
  question: string;
  answer: string;
  is_active: boolean;
}

export function FaqForm({
  action,
  faq,
}: {
  action: (formData: FormData) => void;
  faq?: FaqFormValues;
}) {
  return (
    <form action={action} className="space-y-5">
      {faq?.id && <input type="hidden" name="faqId" value={faq.id} />}

      <div>
        <label htmlFor="question" className={labelClasses}>
          Question
        </label>
        <input
          id="question"
          name="question"
          defaultValue={faq?.question ?? ""}
          required
          placeholder="Quels sont les délais de livraison ?"
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="answer" className={labelClasses}>
          Réponse
        </label>
        <textarea
          id="answer"
          name="answer"
          defaultValue={faq?.answer ?? ""}
          required
          rows={3}
          className={inputClasses}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={faq?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
        />
        Visible sur la boutique
      </label>

      <Button type="submit">{faq?.id ? "Enregistrer" : "Ajouter"}</Button>
    </form>
  );
}
