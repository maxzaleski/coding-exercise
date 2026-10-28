const FALLBACK_COUNTRY_CODE = 'GB';

/** Guess the user's country from their browser language preferences, e.g. `en-GB` gives `GB`. */
export function detectCountryCode(languages: readonly string[] = navigator.languages): string {
  for (const language of languages) {
    try {
      const region = new Intl.Locale(language).maximize().region;
      if (region && /^[A-Z]{2}$/.test(region)) return region;
    } catch {
      // Malformed language tag
    }
  }
  return FALLBACK_COUNTRY_CODE;
}

const countryNames = new Intl.DisplayNames('en-GB', { type: 'region' });

export function countryName(countryCode: string): string {
  return countryNames.of(countryCode) ?? countryCode;
}
