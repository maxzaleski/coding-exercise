import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, api } from './api';

function mockFetch(response: Response) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api client', () => {
  it('encodes the country code in the holidays path', async () => {
    const fetchSpy = mockFetch(Response.json([]));

    await api.holidays('G/B');
    expect(fetchSpy).toHaveBeenCalledWith('/api/holidays/G%2FB', expect.anything());
  });

  it('prefixes requests with a custom base URL', async () => {
    const fetchSpy = mockFetch(Response.json([]));

    await new ApiClient('https://example.test/api').holidays('GB');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.test/api/holidays/GB',
      expect.anything(),
    );
  });

  it('builds the calendar URL from the base URL and country code', () => {
    expect(new ApiClient('https://example.test/api').calendarUrl('GB')).toBe(
      'https://example.test/api/holidays/GB/calendar.ics',
    );
  });

  it('surfaces the backend error message on failure', async () => {
    mockFetch(Response.json({ error: 'Unknown country code' }, { status: 404 }));

    const error = await api.holidays('ZZ').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: 'Unknown country code' });
  });
});
