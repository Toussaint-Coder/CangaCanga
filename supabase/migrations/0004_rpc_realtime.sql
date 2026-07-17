-- ============================================================================
-- CangaCanga — 0004 RPCs + Realtime
-- Geospatial search helpers and realtime publication setup.
-- ============================================================================

-- --- haversine distance in meters -------------------------------------------
create or replace function public.haversine_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- --- nearby open rides ------------------------------------------------------
-- Returns upcoming, open rides ordered by distance from the given point.
create or replace function public.nearby_rides(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision default 30000,
  p_limit integer default 50
)
returns table (
  id uuid,
  driver_id uuid,
  pickup_label text,
  pickup_lat double precision,
  pickup_lng double precision,
  destination_label text,
  destination_lat double precision,
  destination_lng double precision,
  departure_time timestamptz,
  seats_total integer,
  available_seats integer,
  price numeric,
  note text,
  status ride_status,
  distance_m integer,
  duration_s integer,
  created_at timestamptz,
  distance_from_me double precision
)
language sql
stable
as $$
  select r.id, r.driver_id, r.pickup_label, r.pickup_lat, r.pickup_lng,
         r.destination_label, r.destination_lat, r.destination_lng,
         r.departure_time, r.seats_total, r.available_seats, r.price, r.note,
         r.status, r.distance_m, r.duration_s, r.created_at,
         public.haversine_m(p_lat, p_lng, r.pickup_lat, r.pickup_lng) as distance_from_me
  from public.rides r
  where r.status = 'open'
    and r.available_seats > 0
    and r.departure_time > now()
    and public.haversine_m(p_lat, p_lng, r.pickup_lat, r.pickup_lng) <= p_radius_m
  order by distance_from_me asc
  limit p_limit;
$$;

-- --- Realtime publication ---------------------------------------------------
-- Emit change events for the tables the app subscribes to. This replaces the
-- Socket.io event bus described in the spec:
--   reservation_requested / accepted / rejected  -> reservations + notifications
--   ride_created / ride_cancelled                 -> rides
--   notification_received                         -> notifications
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.rides;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.reservations;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

alter table public.rides replica identity full;
alter table public.reservations replica identity full;
alter table public.notifications replica identity full;
