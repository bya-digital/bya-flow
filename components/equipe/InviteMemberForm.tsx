"use client";

import { useState } from "react";
import { inviteMember } from "@/lib/actions/team";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PERMISSION_LABELS } from "@/lib/permissions";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export function InviteMemberForm() {
  const [role, setRole] = useState("member");

  return (
    <form action={inviteMember} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClasses}
          >
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <SubmitButton pendingText="Envoi...">Inviter</SubmitButton>
      </div>

      {role === "member" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600">
            Accès (décochez pour restreindre — tout coché par défaut, comme un membre standard)
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="permissions"
                  value={key}
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
