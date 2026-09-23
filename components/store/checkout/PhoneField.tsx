"use client";

import { useCheckoutContact } from "./CheckoutContactContext";

export function PhoneField({ className }: { className?: string }) {
  const { phone, setPhone } = useCheckoutContact();

  return (
    <input
      id="phone"
      name="phone"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      className={className}
    />
  );
}
