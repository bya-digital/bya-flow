"use client";

import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/lib/actions/customers";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  return (
    <form
      action={deleteCustomer}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer définitivement ce client ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="customerId" value={customerId} />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer le client
      </button>
    </form>
  );
}
