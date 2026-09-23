import { forwardRef } from "react";
import { COUNTRIES } from "@/lib/countries";

// Remplace les anciens champs "Pays" en saisie libre par une liste
// fermée — élimine les fautes de frappe/variantes ("France"/"france"/
// "Francia") qui rendaient le pays inexploitable ailleurs (devise,
// indicatif téléphonique).
export const CountrySelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function CountrySelect({ className, ...props }, ref) {
    return (
      <select ref={ref} className={className} {...props}>
        <option value="">Choisir un pays</option>
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.name}>
            {country.name}
          </option>
        ))}
      </select>
    );
  }
);
