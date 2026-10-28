import { useEffect, useState } from 'react';
import { HolidayGreeting, HolidayList } from './components';
import { api, countryName, detectCountryCode, flagUrl } from './lib';
import type { HolidaySummary } from './lib';

type HolidaysState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; holidays: HolidaySummary[] };

function App() {
  const [countryCode] = useState(detectCountryCode);
  const [state, setState] = useState<HolidaysState>({ status: 'loading' });
  const flag = flagUrl(countryCode);

  useEffect(() => {
    const controller = new AbortController();

    api
      .holidays(countryCode, controller.signal)
      .then((holidays) => setState({ status: 'loaded', holidays }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Something went wrong';
        setState({ status: 'error', message });
      });

    return () => controller.abort();
  }, [countryCode]);

  return (
    <main className="page">
      <header className="page-header">
        {flag && <img className="flag" src={flag} alt="" />}
        <h1>Public holidays in {countryName(countryCode)}</h1>
        {state.status === 'loaded' && state.holidays.length > 0 && (
          <a className="button" href={api.calendarUrl(countryCode)} download>
            Add to Outlook calendar
          </a>
        )}
      </header>

      {state.status === 'loading' && (
        <p className="message" role="status">
          Loading holidays…
        </p>
      )}
      {state.status === 'error' && (
        <p className="message" role="alert">
          Couldn’t load holidays: {state.message}
        </p>
      )}
      {state.status === 'loaded' && (
        <>
          <HolidayGreeting holidays={state.holidays} />
          <HolidayList holidays={state.holidays} />
        </>
      )}
    </main>
  );
}

export default App;
