const BASE_URL = 'https://nagerholidays.com/api/v4/Holidays';
const YEAR = new Date().getFullYear(); // Always the current year

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

/** Get the holidays for a specific country. */
export async function fetchHolidays(countryCode: string): Promise<Holiday[]> {
  const url = `${BASE_URL}/${encodeURIComponent(countryCode)}/${YEAR}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok)
    throw new HolidaysApiError(response.status, `Holidays API responded with ${response.status}`);

  return (await response.json()) as Holiday[];
}
