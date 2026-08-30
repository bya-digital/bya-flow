"use client";

import { inviteMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export function InviteMemberForm() {
  return (
    <form action={inviteMember} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="email" className={labelClasses}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="collegue@exemple.com"
          className={inputClasses}
        />
      </div>
      <div className="sm:w-44">
        <label htmlFor="role" className={labelClasses}>
          Rôle
        </label>
        <select id="role" name="role" defaultValue="member" className={inputClasses}>
          <option value="member">Membre</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>
      <Button type="submit">Inviter</Button>
    </form>
  );
}
