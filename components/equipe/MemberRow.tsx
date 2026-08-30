"use client";

import { removeMember, updateMemberRole } from "@/lib/actions/team";
import type { TeamMember } from "@/lib/data/team";

const selectClasses =
  "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

export function MemberRow({ member }: { member: TeamMember }) {
  const displayName = member.fullName || member.email || "Membre";

  if (member.role === "owner") {
    return (
      <tr>
        <td className="px-4 py-3 font-medium text-slate-900">
          {displayName}
          {member.isSelf && <span className="ml-2 text-xs text-slate-400">(vous)</span>}
        </td>
        <td className="px-4 py-3 text-slate-500">{member.email}</td>
        <td className="px-4 py-3 text-slate-500">{roleLabels[member.role]}</td>
        <td className="px-4 py-3" />
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-3 font-medium text-slate-900">
        {displayName}
        {member.isSelf && <span className="ml-2 text-xs text-slate-400">(vous)</span>}
      </td>
      <td className="px-4 py-3 text-slate-500">{member.email}</td>
      <td className="px-4 py-3">
        <form action={updateMemberRole}>
          <input type="hidden" name="memberId" value={member.id} />
          <select
            name="role"
            defaultValue={member.role}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className={selectClasses}
          >
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </form>
      </td>
      <td className="px-4 py-3 text-right">
        <form
          action={removeMember}
          onSubmit={(e) => {
            if (!window.confirm(`Retirer ${displayName} de l'équipe ?`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="memberId" value={member.id} />
          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
            Retirer
          </button>
        </form>
      </td>
    </tr>
  );
}
