import type { CountrySummary, ErrorResponse, HolidaySummary } from '@shared/types';

export type { CountrySummary, HolidaySummary };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private readonly baseUrl = '/api') {}

  /** Get the countries holidays are available for, sorted by name. */
  countries(signal?: AbortSignal): Promise<CountrySummary[]> {
    return this.request('/countries', signal);
  }

  /** Get this year's holidays for a country, given its two-letter ISO code. */
  holidays(countryCode: string, signal?: AbortSignal): Promise<HolidaySummary[]> {
    return this.request(`/holidays/${encodeURIComponent(countryCode)}`, signal);
  }

  /** URL of an iCalendar file with this year's holidays for a country (to be imported into Outlook). */
  calendarUrl(countryCode: string): string {
    return `${this.baseUrl}/holidays/${encodeURIComponent(countryCode)}/calendar.ics`;
  }

  /** Fetch a JSON resource from the API, throwing an `ApiError` on any non-2xx response. */
  private async request<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as Partial<ErrorResponse> | null;
      throw new ApiError(response.status, body?.error ?? response.statusText);
    }

    return (await response.json()) as T;
  }
}

export const api = new ApiClient();
