const HOLIDAYS_URL = 'https://nagerholidays.com/api/v4/Holidays';
// v4 has no equivalent endpoint.
const COUNTRIES_URL = 'https://nagerholidays.com/api/v3/AvailableCountries';
const CACHE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour

export interface Holiday {
  date: string;
  name: string;
  countryCode: string;
  nationalHoliday: boolean;
  subdivisionCodes: string[] | null;
  holidayTypes: string[];
}

export interface AvailableCountry {
  countryCode: string;
  name: string;
}

export class HolidaysApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Get a JSON resource from the upstream API. */
async function request<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok)
    throw new HolidaysApiError(response.status, `Holidays API responded with ${response.status}`);

  return (await response.json()) as T;
}

// Holds the pending promise rather than the result so that concurrent requests for the same key
// share a single upstream call.
const cache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

/** Return the cached value for `key`, or load and cache it for `CACHE_TTL_MS`. */
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value as Promise<T>;

  const value = load();
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });

  // Failures are evicted s.t. the next request retries instead of replaying the error.
  value.catch(() => {
    if (cache.get(key)?.value === value) cache.delete(key);
  });

  return value;
}

/** Get this year's public holidays for a country, cached for `CACHE_TTL_MS`. */
export function fetchPublicHolidays(countryCode: string): Promise<Holiday[]> {
  const year = new Date().getUTCFullYear();
  const url = `${HOLIDAYS_URL}/${encodeURIComponent(countryCode)}/${year}`;

  // Upstream also returns bank, school, optional and observance days; we only want public holidays.
  return cached(`holidays/${countryCode}/${year}`, () =>
    request<Holiday[]>(url).then((all) =>
      all.filter((holiday) => holiday.holidayTypes.includes('Public')),
    ),
  );
}

/** Get the countries the upstream API has holidays for, cached for `CACHE_TTL_MS`. */
export function fetchAvailableCountries(): Promise<AvailableCountry[]> {
  return cached('countries', () => request<AvailableCountry[]>(COUNTRIES_URL));
}
