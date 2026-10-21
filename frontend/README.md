# ReviewIt — frontend

Angular 22 + Tailwind CSS 4 frontend for ReviewIt. The UI is in Brazilian
Portuguese and uses a neutral white / off-white / light-cream palette with
editorial accents, defined in `src/styles/tokens.css`.

## Requirements

- Node.js 22+ and npm 10+
- No backend is required for the current demo feed (Steps 0–1 use local fixtures).

## Run locally

```bash
cd frontend
npm install

# Local development file (gitignored). Blank Supabase values = demo mode.
cp src/environments/environment.development.example.ts \
   src/environments/environment.development.ts

npm start
```

Open `http://localhost:5173`. The dev server proxies `/api` to
`http://localhost:8080` when the Spring Boot backend is running.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Angular dev server on port 5173 with `/api` proxy |
| `npm run build` | Production build in `dist/frontend/browser` |
| `npm run preview` | Serves the production build on port 4173 |
| `npm test` | Vitest unit tests (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | Angular ESLint |
| `npm run e2e` | Playwright desktop + mobile specs |
| `npm run format` | Prettier across the frontend |

Playwright needs Chromium once per machine:

```bash
npx playwright install chromium
```

## Current scope

Implemented in Steps 0–1:

- app shell, top bar, search, filter popover, avatar, feed panel and custom scroll
  rail;
- static editorial cards, generated covers, skeleton, empty state and 404;
- local demo filtering/search/sort over eight fixtures;
- responsive layouts, keyboard focus, reduced-motion handling;
- unit tests and Playwright desktop/mobile specs.

Next steps: API abstraction/demo mode, `FeedStore` with infinite scroll, post
detail/editor, likes/comments, auth and moderation.

## Documentation

- `../docs/API.md` — backend endpoints.

## Environment

Never put a Supabase service-role key in the frontend. Only the anon key belongs in
`environment.development.ts`; blank values keep the demo mode path.
