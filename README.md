# BlackRock: Coding Exercise

Candidate: Maximilien Zaleski

## Setup

### Install

```sh
npm install
```

This installs the backend dependencies and then the frontend's, under `src/frontend`.

### Run

```sh
npm start
```

This builds the frontend and the backend, then serves both at <http://localhost:8080>.
Set the `PORT` environment variable to use a different port, for example `PORT=3000 npm start`.

### Develop

```sh
npm run build   # build the frontend once, as the backend serves it from src/frontend/dist
npm run dev     # run the backend, restarting it on every change
```

Rebuild the frontend with `npm --prefix src/frontend run build` after changing it.

### Checks

| Command                          | What it does                                                    |
| -------------------------------- | --------------------------------------------------------------- |
| `npm run lint`                   | Checks formatting, lint rules and import order                  |
| `npm run lint:fix`               | Fixes what it safely can, including sorting and pruning imports |
| `npm run format`                 | Formats every file                                              |
| `npm run typecheck`              | Type-checks the backend                                         |
| `npm --prefix src/frontend test` | Runs the frontend tests in watch mode                           |
| `npm run audit:all`              | Audits the backend and frontend dependencies                    |
| `npm run clean`                  | Removes all build output and installed dependencies             |

## Requirements

- ~~Node backend serving an API and a web portal~~
  - ~~Backend consumes the holiday API and summarises the results~~
  - ~~Web portal consumes the API~~
  - ~~Add a cache to prevent unnecessary additional calls to the public API~~
- ~~When a user loads the frontend, public holidays are displayed using the colour green for upcoming and light grey for past~~
- ~~When a user loads the frontend, the flag of their (current/chosen) country is displayed~~
- If today is a public holiday:
  - ~~The user is greeted with a message.~~
  - An animation is triggered once on load and cycles between the country’s official language in its native alphabet, version of the country’s official language while retaining the page alignment & letter direction of its native alphabet, the English version of the greeting.
- Add a navrail or tabs to the UI. Add a new page that shows a world map with countries or regions experiencing a public holiday highlighted.
- Add a date slider beneath the map that allows any day in the calendar year to be selected.
  - The slider should be set to today’s date (or the server mock date) by default but can be moved by the user to select any date and highlight its holidays on the map.
- Create polyphonic versions of each country’s national anthem (as many as possible for the demo).
  - Play the appropriate anthem when the user selects a country or region on the map, while adding a glowing pulse effect to the country or region’s polygon that pulses in time with the music.
  - Also play the correct anthem when the user navigates to the frontend and it is a public holiday in their country.
- ~~Add a button that allows people to add their country’s holidays in Outlook calendar.~~

## Notes

### Scope

To my understanding, the aim of the portal is to let an employee observe a list of their/any country's public holidays (MVP).

The MVP covers:

- A Node server exposing `GET /api/holidays/{countryCode}`, which returns each public holiday with the desired fields.
- An in-memory cache in front of the public API.
- A React frontend served from the same server, showing the holidays as a table with the country's flag.
- Upcoming holidays in green and past holidays in light grey.
- A greeting when today is a public holiday.
- An "Add to Outlook calendar" button that downloads the year's holidays as an `.ics` file.

### Why this order

Building the API first gives the portal and future consumers a single source of truth, avoiding duplicated logic that could drift apart. The frontend view presents the critical information. Calendar export was a small addition that provides immediate value. The remaining features are mostly presentation work and don’t require changes to the data model.

### Implementation details

- The upstream API returns several holiday types; only entries typed `Public` are kept.
- The response body differs from the one in the brief: `date` is an ISO date string rather than a number, and each entry carries extra metadata.
- The cache stores the pending request rather than its result, so concurrent requests for the same country share one upstream call. Entries expire after an hour, and failed requests are evicted so the next caller retries instead of receiving the cached error.
- Dates are calendar dates, so day counts and weekend checks are computed in UTC to avoid holidays shifting by a day in time zones west of UTC.
- The frontend picks the user's country from the browser's language preferences (potential limitation; naive) and falls back to the United Kingdom.

### Not yet implemented

The remaining items in the requirements list above are mostly cosmetic and are independent of the data layer.
