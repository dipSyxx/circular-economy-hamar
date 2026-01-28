# SirkulaerHamar

A platform that supports circular economy decisions in Hamar (Norway): a directory of local actors (second hand, repairs, recycling, rentals, etc.), a map, calculators and quizzes, and an admin panel for moderation and content management.

## Table of contents

- Overview and goals
- Tech stack
- Main sections (pages)
- Architecture and data flows
- Data model (Prisma)
- API (public, admin, helper)
- Authentication and roles
- Content and seed data
- Environment configuration
- Local development
- Admin panel
- Known limitations

## Overview and goals

SirkulaerHamar is a Next.js app that helps residents make more sustainable choices:

- discover local places for repair, reuse, rental, and recycling;
- compare repair vs buy used vs recycle with calculators;
- get recommendations from a decision engine;
- take a quiz and complete challenges (local, gamified profile);
- manage content via an admin interface.

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS + Radix UI/shadcn UI components
- Prisma ORM + Neon Postgres
- Neon Auth (Better Auth)
- Vercel Blob for actor images
- Leaflet + OpenStreetMap
- Framer Motion
- opening_hours for OSM opening hours parsing
- @vercel/analytics

## Main sections (pages)

Navigation labels and copy live in `content/no.ts` (Norwegian localization).

### 1) Marketing pages

Route: `/`
Code: `app/(marketing)/page.tsx`

- Hero section, featured actors, facts, and CTA blocks.
- Data loaded via `lib/public-data.ts`.

### 2) Actors directory

Route: `/aktorer`
Code: `app/(platform)/aktorer/page.tsx`, `components/actors-explorer.tsx`

- Search, filters, sorting (category, tags, favorites).
- Submit a new actor via the public submission form.
- Favorites integration.

Actor card
Code: `components/actor-card.tsx`, `components/favorite-button.tsx`

- Short summary, tags, link to details.
- Favorite toggle.

### 3) Actor details

Route: `/aktorer/[slug]`
Code: `app/(platform)/aktorer/[slug]/page.tsx`

- Full actor profile, contacts, hours, sources.
- OpenStreetMap and Google Maps links.
- Favorite button.

### 4) Map

Route: `/kart`
Code: `components/map-component.tsx`

- Leaflet map with all actors.
- Filters, search, sorting.
- Route mode (up to 3 stops) with distance estimate.
- Optional geolocation.
- Open/closed status from OSM opening hours.

### 5) Decision wizard (decision engine)

Route: `/decide`
Code: `components/decision-wizard.tsx`, `lib/decision-engine.ts`

- Step-by-step inputs (item type, problem, budget/time, priority).
- Algorithm recommends repair/buy_used/donate/recycle.
- Impact/savings/CO2e metrics and matched local actors.

### 6) Repair calculator

Route: `/kalkulator`
Code: `components/calculator.tsx`

- Uses `repair-estimates` data to compare repair vs used vs new.
- Recommends relevant actors.

### 7) Facts

Route: `/fakta`
Code: `app/(platform)/fakta/page.tsx`

- Short fact cards and detailed sections.
- CO2e sources used by the decision engine.

### 8) Quiz

Route: `/quiz`
Code: `components/quiz.tsx`

- Quiz with result level, tips, and sharing.

### 9) Challenges

Route: `/challenges`
Code: `components/challenges-board.tsx`

- Local challenges with points and streaks (stored in localStorage).

### 10) Profile

Route: `/account/profile` (redirect from `/profile`)
Code: `components/profile-dashboard.tsx`

- Local profile stats (score, streak, actions, decisions).
- My favorites and my actor submissions.

### 11) Admin panel

Route: `/admin`
Code: `app/admin/page.tsx`, `components/admin/*`

- Stats dashboard.
- Moderation of pending actors.
- Generic CRUD manager for all resources.

## Architecture and data flows

- Next.js App Router with separate marketing and platform layouts.
- Server components for data loading pages (`getActors`, `getFacts`, etc.).
- Client components for interactivity (map, forms, decision wizard).
- Data source: Neon Postgres via Prisma.
- Public API as the primary data access layer for the UI.
- Admin API for privileged CRUD.

### Project structure (key directories)

- `app/` - routes, layouts, API handlers
- `components/` - UI and feature components
- `lib/` - business logic, data layer, Prisma, decision engine
- `content/` - localized copy and seed content
- `prisma/` - schema and seed
- `public/` - static assets

### Public data flow

1. `lib/public-data.ts` builds a request to `/api/public/*`.
2. `app/api/public/_resource.ts` applies access rules and filters.
3. Prisma reads data from Postgres.

### Actor submission flow

1. User completes the actor submission form (`ActorSubmissionForm`).
2. `POST /api/public/actor-submissions` creates a `pending` actor.
3. Admin approves/rejects in `/admin` (via `PATCH /api/admin/actors/:id`).

## Data model (Prisma)

Schema: `prisma/schema.prisma`.

Core models:

- User / UserProfile: user data plus local stats.
- Actor: main directory entity.
  - ActorRepairService, ActorSource, ActorFavorite as related data.
- Challenge / ChallengeCompletion.
- QuizQuestion / QuizOption / QuizResult / QuizAttempt.
- Decision: decision engine log.
- RepairEstimate: calculator inputs.
- Fact / DetailedFact / DetailedFactSource.
- Co2eSource / Co2eSourceItem.

Key enums:

`ActionType`, `ItemType`, `ProblemType`, `Priority`, `Recommendation`, `DecisionStatus`,
`ConfidenceLevel`, `ActorCategory`, `ActorStatus`, `SourceType`, `UserRole`, `QuizLevel`.

## API

### Public API (dynamic resources)

Universal routes:

- `GET /api/public/[resource]`
- `POST /api/public/[resource]`
- `GET /api/public/[resource]/[id]`
- `PATCH /api/public/[resource]/[id]`
- `DELETE /api/public/[resource]/[id]`

Access rules: `lib/public/resource-config.ts`.

Public read resources:

- actors, actor-repair-services, actor-sources
- challenges, quiz-questions, quiz-options, quiz-results
- repair-estimates
- facts, detailed-facts, detailed-fact-sources
- co2e-sources, co2e-source-items

User-owned resources (auth + owner check):

- users (profile updates)
- user-profiles, user-actions, decisions
- challenge-completions, quiz-attempts

### Public helper endpoints

- `POST /api/public/actor-submissions`
- `PATCH /api/public/actor-submissions/[id]`
- `DELETE /api/public/actor-submissions/[id]`
- `GET /api/public/my-actors`
- `GET/POST /api/public/favorites`
- `GET/DELETE /api/public/favorites/[actorId]`
- `POST /api/uploads` (Vercel Blob upload)
- `DELETE /api/uploads` (delete blob URL)
- `GET /api/address-search` (address autocomplete, oda.com API)
- `GET /api/address-geocode` (coordinates, Nominatim)
- `POST /api/user/sync` (Neon Auth sync)
- `GET|POST /api/auth/*` (Neon Auth handlers)

### Admin API

Universal routes:

- `GET /api/admin/[resource]`
- `POST /api/admin/[resource]`
- `GET /api/admin/[resource]/[id]`
- `PATCH /api/admin/[resource]/[id]`
- `DELETE /api/admin/[resource]/[id]`

Access: admin only (see `lib/admin/resource-config.ts`).

Additional:

- `GET /api/admin/me` - admin check.

## Authentication and roles

- Neon Auth integration via `@neondatabase/auth`.
- `lib/auth/index.ts` syncs users into the database and applies the `admin` role if present.
- `requireUser` and `requireAdmin` enforce access.
- Auth UI at `/auth/*` and `/account/*` (Neon Auth UI).

## Content and seed data

Localized copy and seed content live in `content/no.ts`.

Seed script (`prisma/seed.ts`) populates:

- actors, repair services, sources;
- challenges, quiz questions, results;
- facts and detailed facts;
- CO2e sources;
- repair estimates.

## Environment configuration

Required env vars:

- `DATABASE_URL` or `POSTGRES_PRISMA_URL`
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` / `VERCEL_URL`
- `BLOB_READ_WRITE_TOKEN`

Optional:

- `NEXT_PUBLIC_NEON_DATA_API_URL` (for `lib/neon-data.ts`)
- `NEXT_PUBLIC_NEON_AUTH_URL`

Note: the `.env` file in this repo contains secrets. Do not publish it.

## Local development

```bash
pnpm install
pnpm dev
```

### Prisma

```bash
pnpm prisma db push
pnpm prisma generate
```

### Seed

```bash
pnpm seed
```

## Admin panel

Route: `/admin`

- Moderates pending actors.
- Full CRUD for resources via `ResourceManager`.
- Search, filters, sorting, and lookup fields.

## Known limitations

- `typescript.ignoreBuildErrors = true` in `next.config.mjs`.
- `images.unoptimized = true`.
- Profile, streaks, and history are stored in localStorage (not the database).
- `lib/neon-data.ts` is prepared for the Neon Data API but is not used by the UI.
