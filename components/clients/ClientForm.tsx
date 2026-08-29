"use client";

import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export interface ClientFormValues {
  id?: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  tags: string[];
  notes: string | null;
}

export function ClientForm({
  action,
  client,
}: {
  action: (formData: FormData) => void;
  client?: ClientFormValues;
}) {
  return (
    <form action={action} className="space-y-5">
      {client?.id && <input type="hidden" name="customerId" value={client.id} />}

      <div>
        <label htmlFor="fullName" className={labelClasses}>
          Nom complet
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={client?.full_name ?? ""}
          required
          className={inputClasses}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClasses}>
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={client?.phone ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={labelClasses}>
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={client?.status ?? "prospect"}
            className={inputClasses}
          >
            <option value="prospect">Prospect</option>
            <option value="client">Client</option>
          </select>
        </div>
        <div>
          <label htmlFor="tags" className={labelClasses}>
            Tags (séparés par des virgules)
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={client?.tags.join(", ") ?? ""}
            placeholder="vip, newsletter"
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClasses}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={client?.notes ?? ""}
          rows={3}
          className={inputClasses}
        />
      </div>

      <Button type="submit">{client?.id ? "Enregistrer" : "Créer le client"}</Button>
    </form>
  );
}
