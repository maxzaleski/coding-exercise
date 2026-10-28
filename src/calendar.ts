import ical, {
  ICalCalendarMethod,
  ICalEventBusyStatus,
  ICalEventTransparency,
} from 'ical-generator';
import type { Holiday } from './holidays.js';
import { DAY_MS } from './shared/time.js';

/** Render holidays as an iCalendar document that Outlook and other calendar apps can import. */
export function toICalendar(
  holidays: readonly Holiday[],
  calendarName: string,
  now: Date = new Date(),
): string {
  const calendar = ical({
    name: calendarName,
    method: ICalCalendarMethod.PUBLISH,
    prodId: { company: 'blackrock-th', product: 'Public Holidays', language: 'EN' },
  });
  const seen = new Set<string>();

  for (const holiday of holidays) {
    const key = `${holiday.date}/${holiday.name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // `YYYY-MM-DD` parses as UTC midnight, and all-day dates are written out in UTC, so the
    // event lands on the right day whatever the server's time zone.
    const start = new Date(holiday.date);
    const slug = holiday.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    calendar.createEvent({
      id: `${holiday.date.replaceAll('-', '')}-${holiday.countryCode}-${slug}@blackrock-th`,
      stamp: now,
      start,
      // The end of an all-day event is exclusive, so a single day ends on the following one.
      end: new Date(start.getTime() + DAY_MS),
      allDay: true,
      summary: holiday.name,
      description: holiday.subdivisionCodes?.length
        ? `Public holiday in ${holiday.subdivisionCodes.join(', ')} only.`
        : null,
      transparency: ICalEventTransparency.TRANSPARENT,
      busystatus: ICalEventBusyStatus.FREE,
    });
  }

  return calendar.toString();
}
