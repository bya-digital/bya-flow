"use client";

import { CountrySelect } from "@/components/ui/CountrySelect";
import { useCheckoutContact } from "./CheckoutContactContext";

export function CountryField({ className }: { className?: string }) {
  const { country, selectCountry } = useCheckoutContact();

  return (
    <CountrySelect
      id="country"
      name="country"
      required
      value={country}
      onChange={(e) => selectCountry(e.target.value)}
      className={className}
    />
  );
}
