import type { ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { toICalendar } from './calendar.js';
import type { Holiday } from './holidays.js';
import { fetchAvailableCountries, fetchPublicHolidays, HolidaysApiError } from './holidays.js';
import { DAY_MS } from './shared/time.js';
import type { CountrySummary, ErrorResponse, HolidaySummary } from './shared/types.js';
import { serveFrontend } from './static.js';

const port = Number(process.env.PORT ?? 8080);

const countryNames = new Intl.DisplayNames('en-GB', { type: 'region' });

/** Summarise a holiday into a more compact representation. */
function summarise(holiday: Holiday, today: string): HolidaySummary {
  const holidayDate = new Date(holiday.date);

  // Calculate the number of days until the holiday and whether it falls on a weekend.
  const days = (holidayDate.getTime() - Date.parse(today)) / DAY_MS;
  const dayOfWeek = holidayDate.getUTCDay();

  return {
    country: countryNames.of(holiday.countryCode) ?? holiday.countryCode,
    countryCode: holiday.countryCode,
    name: holiday.name,
    date: holiday.date,
    daysUntil: days >= 0 ? days : null,
    weekend: dayOfWeek === 0 || dayOfWeek === 6 ? 'Yes' : 'No',
  };
}

/** Write a JSON response to the client. */
function sendJson<T>(res: ServerResponse, status: number, body: T): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  // GET `/api/health`
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  // GET `/api/countries`
  if (req.method === 'GET' && pathname === '/api/countries') {
    try {
      const countries = await fetchAvailableCountries();
      const summaries: CountrySummary[] = countries
        .map(({ countryCode }) => ({
          countryCode,
          name: countryNames.of(countryCode) ?? countryCode,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
      sendJson(res, 200, summaries);
    } catch (error) {
      console.error(error);
      sendJson<ErrorResponse>(res, 502, { error: 'Failed to fetch countries' });
    }
    return;
  }

  // GET `/api/holidays/{countryCode}` and `/api/holidays/{countryCode}/calendar.ics`
  const holidaysMatch =
    req.method === 'GET'
      ? /^\/api\/holidays\/([A-Za-z]{2})(\/calendar\.ics)?$/.exec(pathname)
      : null;
  if (holidaysMatch?.[1]) {
    const countryCode = holidaysMatch[1].toUpperCase();
    try {
      const holidays = await fetchPublicHolidays(countryCode);

      // If the request is for the iCalendar file, generate and return it.
      if (holidaysMatch[2]) {
        const country = countryNames.of(countryCode) ?? countryCode;
        const year = new Date().getUTCFullYear();
        res.writeHead(200, {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="holidays-${countryCode}-${year}.ics"`,
        });
        res.end(toICalendar(holidays, `Public holidays in ${country}`));
        return;
      }

      // Otherwise, summarise and return the holidays as JSON.
      const today = new Date().toISOString().slice(0, 10);
      sendJson(
        res,
        200,
        holidays.map((holiday) => summarise(holiday, today)),
      );
    } catch (error) {
      if (error instanceof HolidaysApiError && error.status === 404) {
        sendJson<ErrorResponse>(res, 404, { error: 'Unknown country code' });
        return;
      }
      console.error(error);
      sendJson<ErrorResponse>(res, 502, { error: 'Failed to fetch holidays' });
    }
    return;
  }

  // GET `/` and any other frontend route.
  if (req.method === 'GET' && (await serveFrontend(res, pathname))) return;

  // 404 for any other request.
  sendJson<ErrorResponse>(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
