/** Holiday as returned by `GET /api/holidays/{countryCode}`. */
export interface HolidaySummary {
  country: string;
  countryCode: string;
  name: string;
  date: string;
  daysUntil: number | null;
  weekend: 'Yes' | 'No';
}

/** Country as returned by `GET /api/countries`. */
export interface CountrySummary {
  countryCode: string;
  name: string;
}

/** Body of every non-2xx API response. */
export interface ErrorResponse {
  error: string;
}
