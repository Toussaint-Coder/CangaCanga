-- ============================================================================
-- CangaCanga — 0001 init
-- Core schema: profiles, rides, reservations, notifications, reviews.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type ride_status as enum ('open', 'full', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'reservation_requested',
    'reservation_accepted',
    'reservation_rejected',
    'ride_cancelled',
    'ride_reminder'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles  (maps to the "User" model — there is NO role/driver field)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  full_name             text not null,
  phone_number          text not null unique,
  profile_picture       text,
  vehicle_plate_number  text,
  rating                numeric(3, 2) not null default 0,
  rating_count          integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.profiles is 'App users. Anyone becomes a "driver" simply by creating a ride.';

-- ---------------------------------------------------------------------------
-- rides
-- ---------------------------------------------------------------------------
create table if not exists public.rides (
  id                  uuid primary key default gen_random_uuid(),
  driver_id           uuid not null references public.profiles (id) on delete cascade,
  pickup_label        text not null,
  pickup_lat          double precision not null,
  pickup_lng          double precision not null,
  destination_label   text not null,
  destination_lat     double precision not null,
  destination_lng     double precision not null,
  departure_time      timestamptz not null,
  seats_total         integer not null check (seats_total > 0),
  available_seats     integer not null check (available_seats >= 0),
  price               numeric(12, 2) not null default 0 check (price >= 0),
  note                text,
  status              ride_status not null default 'open',
  distance_m          integer,      -- estimated, from Mapbox Directions
  duration_s          integer,      -- estimated, from Mapbox Directions
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists rides_driver_idx on public.rides (driver_id);
create index if not exists rides_status_time_idx on public.rides (status, departure_time);
create index if not exists rides_geo_idx on public.rides (pickup_lat, pickup_lng);

-- ---------------------------------------------------------------------------
-- reservations
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id            uuid primary key default gen_random_uuid(),
  ride_id       uuid not null references public.rides (id) on delete cascade,
  passenger_id  uuid not null references public.profiles (id) on delete cascade,
  seats         integer not null default 1 check (seats > 0),
  status        reservation_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (ride_id, passenger_id)
);

create index if not exists reservations_ride_idx on public.reservations (ride_id);
create index if not exists reservations_passenger_idx on public.reservations (passenger_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text not null,
  data        jsonb not null default '{}'::jsonb,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles (id) on delete cascade,
  receiver_id  uuid not null references public.profiles (id) on delete cascade,
  ride_id      uuid references public.rides (id) on delete set null,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now(),
  unique (author_id, ride_id),
  check (author_id <> receiver_id)
);

create index if not exists reviews_receiver_idx on public.reviews (receiver_id);
