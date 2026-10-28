import type { HolidaySummary } from '../lib';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  // Holiday dates are calendar dates, parsed as UTC midnight; formatting in the user's time zone
  // would shift them a day back west of UTC.
  timeZone: 'UTC',
});

export function HolidayList({ holidays }: { holidays: HolidaySummary[] }) {
  if (holidays.length === 0) return <p className="message">No public holidays found this year.</p>;

  return (
    <div className="table-scroll">
      <table className="holidays">
        <thead>
          <tr>
            <th scope="col">Country</th>
            <th scope="col">Holiday</th>
            <th scope="col">Date</th>
            <th scope="col">Days until</th>
            <th scope="col">Weekend</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map((holiday, index) => (
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: upstream repeats a holiday once per subdivision, and the list is never reordered.
              key={`${holiday.date}-${holiday.name}-${index}`}
              className={holiday.daysUntil === null ? 'holiday-past' : 'holiday-upcoming'}
            >
              <td>{holiday.country}</td>
              <td>{holiday.name}</td>
              <td>
                <time dateTime={holiday.date}>{dateFormat.format(new Date(holiday.date))}</time>
              </td>
              <td className="numeric">{holiday.daysUntil ?? ''}</td>
              <td>{holiday.weekend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
