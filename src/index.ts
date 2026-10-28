import { createServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import { constants } from 'node:http2';
import { fetchPublicHolidays, HolidaysApiError } from './holidays.js';
import type { Holiday } from './holidays.js';
import type { ErrorResponse, HolidaySummary } from './shared/types.js';
import { serveFrontend } from './static.js';

const port = Number(process.env.PORT ?? 8080);

const countryNames = new Intl.DisplayNames('en-GB', { type: 'region' });

/** Summarise a holiday into a more compact representation. */
function summarise(holiday: Holiday, today: string): HolidaySummary {
  const holidayDate = new Date(holiday.date);

  // Calculate the number of days until the holiday and whether it falls on a weekend.
  const days = (holidayDate.getTime() - Date.parse(today)) / (24 * 60 * 60 * 1000);
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
    sendJson(res, constants.HTTP_STATUS_OK, { status: 'ok' });
    return;
  }

  // GET `/api/holidays/{countryCode}`
  const holidaysMatch =
    req.method === 'GET' ? /^\/api\/holidays\/([A-Za-z]{2})$/.exec(pathname) : null;
  if (holidaysMatch?.[1]) {
    try {
      const holidays = await fetchPublicHolidays(holidaysMatch[1].toUpperCase());
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
