const BASE_URL = 'https://nagerholidays.com/api/v4/Holidays';
const CACHE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour

export interface Holiday {
  date: string;
  name: string;
  countryCode: string;
  nationalHoliday: boolean;
  subdivisionCodes: string[] | null;
  holidayTypes: string[];
}

export class HolidaysApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Get all holidays for a country and year from the upstream API, whatever their type. */
async function requestHolidays(countryCode: string, year: number): Promise<Holiday[]> {
  const url = `${BASE_URL}/${encodeURIComponent(countryCode)}/${year}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok)
    throw new HolidaysApiError(response.status, `Holidays API responded with ${response.status}`);

  return (await response.json()) as Holiday[];
}

// Keyed by `{countryCode}/{year}`. Holds the pending promise rather than the result so that
// concurrent requests for the same country share a single call.
const cache = new Map<string, { expiresAt: number; holidays: Promise<Holiday[]> }>();

/** Get this year's public holidays for a country, cached for `CACHE_TTL_MS`. */
export function fetchPublicHolidays(countryCode: string): Promise<Holiday[]> {
  const year = new Date().getUTCFullYear();
  const key = `${countryCode}/${year}`;

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.holidays;

  // Upstream also returns bank, school, optional and observance days; we only want public holidays.
  const holidays = requestHolidays(countryCode, year).then((all) =>
    all.filter((holiday) => holiday.holidayTypes.includes('Public')),
  );
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, holidays });

  // Failures are evicted s.t. the next request retries instead of replaying the error.
  holidays.catch(() => {
    if (cache.get(key)?.holidays === holidays) cache.delete(key);
  });

  return holidays;
}
