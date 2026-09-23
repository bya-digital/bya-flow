"use client";

import { useState } from "react";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { currencyForCountryName } from "@/lib/countries";

const CURRENCIES = ["EUR", "USD", "GBP", "CAD", "XOF", "XAF", "CHF"];

// Le pays choisi pré-remplit la devise correspondante — jamais EUR
// imposé par défaut sans rapport avec le pays réel de la boutique.
// La devise reste modifiable ensuite (une boutique peut facturer
// dans une devise différente de celle de son pays).
export function CountryCurrencyFields({
  countryInputClassName,
  currencyInputClassName,
  countryId = "country",
  currencyId = "currency",
  countryLabel,
  currencyLabel,
  labelClassName,
}: {
  countryInputClassName?: string;
  currencyInputClassName?: string;
  countryId?: string;
  currencyId?: string;
  countryLabel?: string;
  currencyLabel?: string;
  labelClassName?: string;
}) {
  const [currency, setCurrency] = useState("");

  return (
    <>
      <div>
        {countryLabel && (
          <label htmlFor={countryId} className={labelClassName}>
            {countryLabel}
          </label>
        )}
        <CountrySelect
          id={countryId}
          name="country"
          className={countryInputClassName}
          onChange={(e) => setCurrency(currencyForCountryName(e.target.value) ?? "")}
        />
      </div>
      <div>
        {currencyLabel && (
          <label htmlFor={currencyId} className={labelClassName}>
            {currencyLabel}
          </label>
        )}
        <select
          id={currencyId}
          name="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={currencyInputClassName}
        >
          <option value="" disabled>
            Choisir une devise
          </option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
