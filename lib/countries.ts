// Liste volontairement limitée aux pays dont la devise correspond à
// l'une des devises réellement supportées par la boutique (EUR, USD,
// GBP, CAD, XOF, XAF, CHF) — inutile de proposer un pays dont la
// devise ne serait pas disponible ensuite. Priorité donnée à
// l'Afrique francophone (marché principal de BYA Digital) et aux
// grands marchés occidentaux.
export interface Country {
  name: string;
  code: string;
  dialCode: string;
  currency: string;
}

export const COUNTRIES: Country[] = [
  { name: "Allemagne", code: "DE", dialCode: "+49", currency: "EUR" },
  { name: "Autriche", code: "AT", dialCode: "+43", currency: "EUR" },
  { name: "Belgique", code: "BE", dialCode: "+32", currency: "EUR" },
  { name: "Bénin", code: "BJ", dialCode: "+229", currency: "XOF" },
  { name: "Burkina Faso", code: "BF", dialCode: "+226", currency: "XOF" },
  { name: "Cameroun", code: "CM", dialCode: "+237", currency: "XAF" },
  { name: "Canada", code: "CA", dialCode: "+1", currency: "CAD" },
  { name: "Congo", code: "CG", dialCode: "+242", currency: "XAF" },
  { name: "Côte d'Ivoire", code: "CI", dialCode: "+225", currency: "XOF" },
  { name: "Espagne", code: "ES", dialCode: "+34", currency: "EUR" },
  { name: "États-Unis", code: "US", dialCode: "+1", currency: "USD" },
  { name: "Finlande", code: "FI", dialCode: "+358", currency: "EUR" },
  { name: "France", code: "FR", dialCode: "+33", currency: "EUR" },
  { name: "Gabon", code: "GA", dialCode: "+241", currency: "XAF" },
  { name: "Grèce", code: "GR", dialCode: "+30", currency: "EUR" },
  { name: "Guinée-Bissau", code: "GW", dialCode: "+245", currency: "XOF" },
  { name: "Guinée équatoriale", code: "GQ", dialCode: "+240", currency: "XAF" },
  { name: "Irlande", code: "IE", dialCode: "+353", currency: "EUR" },
  { name: "Italie", code: "IT", dialCode: "+39", currency: "EUR" },
  { name: "Luxembourg", code: "LU", dialCode: "+352", currency: "EUR" },
  { name: "Mali", code: "ML", dialCode: "+223", currency: "XOF" },
  { name: "Niger", code: "NE", dialCode: "+227", currency: "XOF" },
  { name: "Pays-Bas", code: "NL", dialCode: "+31", currency: "EUR" },
  { name: "Portugal", code: "PT", dialCode: "+351", currency: "EUR" },
  { name: "République centrafricaine", code: "CF", dialCode: "+236", currency: "XAF" },
  { name: "Royaume-Uni", code: "GB", dialCode: "+44", currency: "GBP" },
  { name: "Sénégal", code: "SN", dialCode: "+221", currency: "XOF" },
  { name: "Suisse", code: "CH", dialCode: "+41", currency: "CHF" },
  { name: "Tchad", code: "TD", dialCode: "+235", currency: "XAF" },
  { name: "Togo", code: "TG", dialCode: "+228", currency: "XOF" },
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

export function getCountryByName(name: string | null | undefined): Country | undefined {
  if (!name) return undefined;
  return COUNTRIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
}

export function currencyForCountryName(name: string | null | undefined): string | undefined {
  return getCountryByName(name)?.currency;
}

// Retire un indicatif déjà présent en tête du numéro (l'utilisateur a
// changé de pays après avoir commencé à saisir) avant d'appliquer le
// nouveau — jamais un doublon du type "+33 +229 6...".
export function stripKnownDialCode(phone: string): string {
  const trimmed = phone.trim();
  for (const country of COUNTRIES) {
    if (trimmed.startsWith(country.dialCode)) {
      return trimmed.slice(country.dialCode.length).trim();
    }
  }
  return trimmed;
}
