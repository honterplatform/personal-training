# LOG

Personal training tracker. Single user, password-gated. React + Express + MongoDB Atlas, deployable to Railway as one service.

## Stack

- Client: React 18 + Vite
- Server: Node + Express (ES modules)
- DB: MongoDB Atlas via Mongoose
- AI: `@anthropic-ai/sdk`, model `claude-sonnet-4-6`

## Local development

Requires Node 18+ and a MongoDB Atlas connection string.

```bash
# 1. install all deps
npm run install:all

# 2. configure env
cp server/.env.example server/.env
# edit server/.env — set MONGO_URI, APP_PASSWORD, COOKIE_SECRET, ANTHROPIC_API_KEY

# 3. (optional) seed sample data
npm run seed

# 4. run dev (server on :4000, client on :5173 with /api proxy)
npm run dev
```

Open http://localhost:5173 and enter the password you set in `APP_PASSWORD`.

## Production build

```bash
npm run install:all
npm run build          # client → client/dist
NODE_ENV=production npm start
```

Express serves `client/dist` and falls back non-`/api` routes to `index.html`.

## Deploy to Railway

Single service.

- **Build command**: `npm run install:all && npm run build`
- **Start command**: `npm start`
- **Env vars** (set in Railway):
  - `MONGO_URI`
  - `APP_PASSWORD`
  - `COOKIE_SECRET` (any long random string)
  - `ANTHROPIC_API_KEY`
  - `NODE_ENV=production`
  - `PORT` — provided by Railway automatically

## Data model

- `Settings` — one document: `bodyWeightKg`, `proteinGoalG`
- `Entry` — per day / activity. Activities: `walk`, `squash`, `taekwondo`, `strength`, `protein`. Unique on `(date, activity)`.
- `Summary` — weekly coach summary cache, keyed by Monday ISO date.

All dates stored as `YYYY-MM-DD` strings in America/Bogotá local time.

## API

All routes except `POST /api/auth` require the signed auth cookie.

- `POST /api/auth` — `{ password }` → sets 30-day HTTP-only cookie
- `GET /api/settings` / `PUT /api/settings`
- `GET /api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `PUT /api/entries/:date/:activity` — upsert. On save, if workout is `done` with `durationMin > 0`, server asks Claude to estimate `caloriesBurned`. Falls back to local MET formula on API failure.
- `DELETE /api/entries/:date/:activity`
- `GET /api/summary/:weekStart` — cached summary or `{ text: null }`
- `POST /api/summary/:weekStart` — generate fresh summary from last 7 days, cache, return

## Notes

- Calorie fallback uses MET values: walk 3.5, squash 7.3, taekwondo 10.0, strength 5.0, scaled by `(0.7 + rpe × 0.06)`.
- The strength routine on the strength row is read-only reference only.
