# CangaCanga

A community carpooling app for **Burundi**. People already driving somewhere
share their empty seats with others heading the same way — simple, affordable,
and reliable, even on slower mobile networks.

> This is **not** an Uber clone. Anyone can create a ride and instantly becomes
> the driver for that trip. There is no separate "driver" role.

- **User flow:** register → log in → create a ride (you become its driver) →
  others browse rides → a passenger reserves a seat → the driver accepts or
  rejects → both meet for the trip.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Architecture decisions](#architecture-decisions)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Backend setup (Supabase)](#backend-setup-supabase)
- [Cloudflare R2 (profile pictures)](#cloudflare-r2-profile-pictures)
- [Mapbox](#mapbox)
- [Running the app](#running-the-app)
- [Data model](#data-model)
- [Service / API reference](#service--api-reference)
- [Realtime events](#realtime-events)
- [Security](#security)
- [Future-ready roadmap](#future-ready-roadmap)

---

## Tech stack

**Frontend**

- React Native (Expo SDK 52) + Expo Router
- NativeWind (Tailwind) for styling — **no gradients**, soft shadows, 16–20px radii
- React Query (`@tanstack/react-query`) + Axios
- React Hook Form + Zod
- Zustand (global auth state)
- React Native MMKV (persistent session + preferences)
- Expo Location, Expo Image Picker, Expo Image
- React Native Reanimated + Moti (micro-interactions)
- Lucide React Native (icons)
- Mapbox (`@rnmapbox/maps`) for maps, geocoding, directions

**Backend**

- **Supabase**: Auth, PostgreSQL, Realtime, Row Level Security
- **Cloudflare R2**: profile picture storage (via a Supabase Edge Function that
  issues presigned upload URLs)

## Architecture decisions

The original brief mixed two backends (a Supabase-direct client **and** a
Node/Express/MongoDB/Socket.io server). Since the provided credentials are
Supabase + R2 and the brief states *"the frontend must communicate directly
with Supabase using the official JavaScript client"*, this project is
**Supabase-first**. The classic backend concepts map cleanly onto it:

| Brief (Express/Mongo) | Implemented with |
| --- | --- |
| JWT auth + bcrypt hashing | Supabase Auth (GoTrue hashes with bcrypt, issues JWTs) |
| Models / Controllers / Routes | SQL tables + triggers/functions in `supabase/migrations` |
| Middleware / RLS | PostgreSQL Row Level Security policies |
| Socket.io events | **Supabase Realtime** (Postgres change streams) |
| Rate limiting / Helmet / CORS | Handled by the Supabase platform |
| Cloudinary | ❌ not used — **Cloudflare R2** instead |

**Phone + password with no email/OTP.** The product requires only a phone
number and password (no email, no OTP). Supabase Auth is used with a
deterministic **phone → pseudo-email** mapping (`<digits>@phone.cangacanga.app`),
so no SMS provider is needed. The real phone number lives on the user's profile.
You must **disable "Confirm email"** in Supabase Auth settings (see below).

## Project structure

```
CangaCanga/
├── app/                          # Expo Router routes (screens only)
│   ├── _layout.tsx               # Providers, fonts, auth bootstrap, root Stack
│   ├── index.tsx                 # Auth-based redirect
│   ├── (auth)/                   # login, register (+ guard)
│   ├── (tabs)/                   # Home, Explore, My Trips, Alerts, Profile + FAB
│   ├── ride/create.tsx           # Create ride (modal)
│   ├── ride/[id].tsx             # Ride details + reservation flow
│   └── profile/edit.tsx          # Edit profile (modal)
│
├── src/
│   ├── components/                # Reusable UI
│   │   ├── ui/                    # Button, Input, Card, Avatar, Badge, …
│   │   ├── map/                   # Mapbox wrapper (RideMap) + init
│   │   └── rides/                 # RideCard, PlaceSearchInput
│   ├── config/env.ts             # Validated env access
│   ├── features/                 # Feature-based modules (service + hooks + schema)
│   │   ├── auth/  rides/  reservations/
│   │   ├── notifications/  reviews/  profile/  location/
│   ├── lib/                      # queryClient, MMKV storage
│   ├── services/                 # Cross-cutting infra: supabase, mapbox, r2
│   ├── stores/                   # Zustand stores (authStore)
│   ├── theme/                    # Design tokens (colors, radius, shadow, fonts)
│   ├── types/                    # database.ts (schema types) + models.ts
│   └── utils/                    # format, phone, cn
│
├── supabase/
│   ├── migrations/               # 0001 init, 0002 triggers, 0003 RLS, 0004 rpc+realtime
│   └── functions/r2-presign/     # Edge function: presigned R2 uploads
│
├── app.config.ts                 # Dynamic Expo config (reads env)
├── tailwind.config.js  global.css  babel.config.js  metro.config.js
└── .env.example
```

## Prerequisites

- Node.js 18+ and npm
- A physical device or emulator
- **A custom dev build is required** (Expo Go will not work) because the app
  uses native modules: `@rnmapbox/maps`, `react-native-mmkv`, and
  `@react-native-community/datetimepicker`.
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) to run
  migrations and deploy the edge function.

## Environment variables

Copy `.env.example` to `.env` and fill it in. Client-visible values **must** be
prefixed with `EXPO_PUBLIC_`.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=        # pk.* runtime token
MAPBOX_DOWNLOAD_TOKEN=                  # sk.* build-time only

EXPO_PUBLIC_R2_PUBLIC_URL=              # public bucket URL only
```

> The client only ever sees the **public** R2 bucket URL. All R2 credentials
> (account id, access key, secret key, bucket) live server-side as `r2-presign`
> edge function secrets set via `supabase secrets set`. See below.

## Backend setup (Supabase)

1. Open your project → **SQL Editor** and run the migrations in order:
   `supabase/migrations/0001_init.sql` → `0002` → `0003` → `0004`.
   (Or with the CLI: `supabase db push`.)
2. **Auth → Providers → Email:** turn **OFF** "Confirm email" (required for the
   phone→email strategy to log users in immediately). Leave Email provider
   enabled.
3. **Database → Replication / Realtime:** the migrations already add `rides`,
   `reservations`, and `notifications` to the `supabase_realtime` publication.

## Cloudflare R2 (profile pictures)

Uploads never expose the R2 secret to the device. The client asks the
`r2-presign` edge function for a short-lived presigned `PUT` URL, then uploads
the bytes directly to R2.

Deploy and configure it:

```bash
supabase functions deploy r2-presign
supabase secrets set \
  R2_ACCOUNT_ID=... \
  R2_ACCESS_KEY_ID=... \
  R2_SECRET_ACCESS_KEY=... \
  R2_BUCKET_NAME=... \
  R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

Enable public access (an `r2.dev` public URL or a custom domain) on the bucket
so avatars can be displayed.

## Mapbox

1. Create a Mapbox account and get a **public** token (`pk.*`) →
   `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.
2. Create a **secret download** token (`sk.*`, with `Downloads:Read`) →
   `MAPBOX_DOWNLOAD_TOKEN` (used only when building the native app).
3. Rebuild the dev client after setting these.

Until a token is present, the app stays fully usable — maps render a clean
placeholder and place search shows a hint.

## Running the app

```bash
# 1. Install dependencies
npm install

# 2. (once) generate placeholder icons if missing
node scripts/gen-assets.js

# 3. Create a native dev build (required for native modules)
npx expo prebuild
npx expo run:android      # or: npx expo run:ios

# subsequent runs
npm start                 # start Metro; open in your dev build
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run format`.

## Data model

| Table | Key fields |
| --- | --- |
| `profiles` | `id`, `full_name`, `phone_number` (unique), `profile_picture`, `vehicle_plate_number`, `rating`, `rating_count`, timestamps |
| `rides` | `driver_id`, pickup/destination label + lat/lng, `departure_time`, `seats_total`, `available_seats`, `price`, `note`, `status`, `distance_m`, `duration_s` |
| `reservations` | `ride_id`, `passenger_id`, `seats`, `status` — unique per (ride, passenger) |
| `notifications` | `user_id`, `type`, `title`, `body`, `data`, `read` |
| `reviews` | `author_id`, `receiver_id`, `ride_id`, `rating` (1–5), `comment` |

Statuses: ride = `open | full | in_progress | completed | cancelled`;
reservation = `pending | accepted | rejected | cancelled`.

## Service / API reference

All backend access is through typed service modules (no REST controllers).

**Auth** (`features/auth/auth.service.ts`)
- `register(input)` — sign up, upload avatar to R2, create profile
- `login({ phoneNumber, password })`, `logout()`, `fetchMyProfile()`

**Rides** (`features/rides/rides.service.ts`)
- `createRide(input)` — inserts a ride (you become the driver); estimates
  distance/duration via Mapbox
- `getRide(id)`, `listRides(filters)` (paginated browse),
  `getNearbyRides(location, radius)` (RPC `nearby_rides`),
  `getMyRidesAsDriver()`, `cancelRide(id)`

**Reservations** (`features/reservations/reservations.service.ts`)
- `reserveSeat(rideId, seats)`, `getReservationsForRide(rideId)`,
  `respondToReservation(id, accept)`, `getMyReservations()`,
  `cancelReservation(id)`

**Notifications** — `getNotifications()`, `getUnreadCount()`, `markAsRead(id)`,
`markAllAsRead()`
**Reviews** — `createReview(input)`, `getReviewsForUser(userId)`
**Profile** — `getProfile(id)`, `updateProfile(userId, input)`,
`getProfileStats(userId)`

Each feature also exposes React Query hooks (e.g. `useNearbyRides`,
`useReserveSeat`, `useRespondToReservation`) with cache invalidation wired up.

## Realtime events

Supabase Realtime replaces the Socket.io event bus. `useRealtime()` (mounted in
the tabs layout) subscribes per-user and refreshes caches live:

| Brief event | Source |
| --- | --- |
| `reservation_requested` | `reservations` INSERT → driver notification (trigger) |
| `reservation_accepted` / `reservation_rejected` | `reservations` UPDATE → passenger notification |
| `ride_created` | `rides` INSERT |
| `ride_cancelled` | `rides` UPDATE → passenger notifications (trigger) |
| `notification_received` | `notifications` INSERT |

Seat accounting (decrement on accept, restore on cancel) and rating
recomputation are handled by database triggers in `0002_functions_triggers.sql`.

## Security

- **JWT auth + bcrypt** via Supabase Auth.
- **Row Level Security** on every table (`0003_rls.sql`): users only read/write
  what they should; notifications are created only by `SECURITY DEFINER`
  triggers.
- **Input validation** with Zod on all forms.
- **No secrets in the client**: the R2 secret lives only in the edge function.
- Rate limiting / abuse protection provided by the Supabase platform.

## Future-ready roadmap

The schema and feature-based architecture are designed to extend without
rewrites (not implemented yet): recurring trips, women-only trips, company
commuting, wallet + mobile money, push notifications, in-app chat, live
tracking, emergency SOS, analytics, admin dashboard, QR boarding.
