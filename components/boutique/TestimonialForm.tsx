"use client";

import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export interface TestimonialFormValues {
  id?: string;
  author_name: string;
  quote: string;
  is_active: boolean;
}

export function TestimonialForm({
  action,
  testimonial,
}: {
  action: (formData: FormData) => void;
  testimonial?: TestimonialFormValues;
}) {
  return (
    <form action={action} className="space-y-5">
      {testimonial?.id && <input type="hidden" name="testimonialId" value={testimonial.id} />}

      <div>
        <label htmlFor="authorName" className={labelClasses}>
          Nom
        </label>
        <input
          id="authorName"
          name="authorName"
          defaultValue={testimonial?.author_name ?? ""}
          required
          placeholder="Awa K."
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="quote" className={labelClasses}>
          Témoignage
        </label>
        <textarea
          id="quote"
          name="quote"
          defaultValue={testimonial?.quote ?? ""}
          required
          rows={3}
          className={inputClasses}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={testimonial?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
        />
        Visible sur la boutique
      </label>

      <Button type="submit">{testimonial?.id ? "Enregistrer" : "Ajouter"}</Button>
    </form>
  );
}
