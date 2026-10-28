import type { HolidaySummary } from '../lib';

const listFormat = new Intl.ListFormat('en-GB', { type: 'conjunction' });

/** Greets the user when one or more of the holidays falls on today. */
export function HolidayGreeting({ holidays }: { holidays: HolidaySummary[] }) {
  const names = [...new Set(holidays.filter((h) => h.daysUntil === 0).map((h) => h.name))];
  if (names.length === 0) return null;

  return (
    <p className="greeting" role="status">
      Happy {listFormat.format(names)}! 🎉
    </p>
  );
}
