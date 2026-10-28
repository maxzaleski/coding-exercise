import { useEffect, useState } from 'react';
import type { CountrySummary } from '../lib';
import { api, countryName } from '../lib';

interface CountrySelectProps {
  value: string;
  onChange: (countryCode: string) => void;
}

/** Lets the user pick the country to show holidays for, defaulting to the detected one. */
export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [countries, setCountries] = useState<CountrySummary[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    api
      .countries(controller.signal)
      .then(setCountries)
      .catch((error: unknown) => {
        // The select still shows the current country, so the page stays usable without the list.
        if (!controller.signal.aborted) console.error(error);
      });

    return () => controller.abort();
  }, []);

  // A detected country the API doesn't cover is kept as an option so the select reflects the
  // page heading rather than silently showing another country.
  const options = countries.some((country) => country.countryCode === value)
    ? countries
    : [{ countryCode: value, name: countryName(value) }, ...countries];

  return (
    <select
      className="country-select"
      aria-label="Country"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map(({ countryCode, name }) => (
        <option key={countryCode} value={countryCode}>
          {name}
        </option>
      ))}
    </select>
  );
}
