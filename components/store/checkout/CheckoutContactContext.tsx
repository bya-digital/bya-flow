"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getCountryByName, stripKnownDialCode } from "@/lib/countries";

interface CheckoutContactValue {
  country: string;
  phone: string;
  selectCountry: (name: string) => void;
  setPhone: (value: string) => void;
}

const CheckoutContactContext = createContext<CheckoutContactValue | null>(null);

// Partage l'état pays/téléphone entre les deux sections du formulaire
// de checkout (Coordonnées et Adresse de livraison, physiquement
// éloignées dans la mise en page) sans changer la disposition
// existante — choisir un pays met à jour l'indicatif en tête du
// numéro, sans écraser les chiffres déjà saisis.
export function CheckoutContactProvider({
  defaultCountry = "",
  defaultPhone = "",
  children,
}: {
  defaultCountry?: string;
  defaultPhone?: string;
  children: ReactNode;
}) {
  const [country, setCountry] = useState(defaultCountry);
  const [phone, setPhone] = useState(() => {
    if (defaultPhone) return defaultPhone;
    const dialCode = getCountryByName(defaultCountry)?.dialCode;
    return dialCode ? `${dialCode} ` : "";
  });

  const selectCountry = (name: string) => {
    setCountry(name);
    const dialCode = getCountryByName(name)?.dialCode;
    setPhone((prev) => {
      const rest = stripKnownDialCode(prev);
      return dialCode ? `${dialCode} ${rest}`.trimEnd() : rest;
    });
  };

  return (
    <CheckoutContactContext.Provider value={{ country, phone, selectCountry, setPhone }}>
      {children}
    </CheckoutContactContext.Provider>
  );
}

export function useCheckoutContact() {
  const ctx = useContext(CheckoutContactContext);
  if (!ctx) throw new Error("useCheckoutContact must be used within CheckoutContactProvider");
  return ctx;
}
