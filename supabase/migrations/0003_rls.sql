-- ============================================================================
-- CangaCanga — 0003 Row Level Security
-- ============================================================================

alter table public.profiles     enable row level security;
alter table public.rides        enable row level security;
alter table public.reservations enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews      enable row level security;

-- --- profiles ---------------------------------------------------------------
-- Driver info (name, photo, rating, plate) is shown publicly across the app,
-- so profiles are readable by any authenticated user, writable only by owner.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- --- rides ------------------------------------------------------------------
drop policy if exists "rides_select" on public.rides;
create policy "rides_select" on public.rides
  for select to authenticated using (true);

drop policy if exists "rides_insert_own" on public.rides;
create policy "rides_insert_own" on public.rides
  for insert to authenticated with check (driver_id = auth.uid());

drop policy if exists "rides_update_own" on public.rides;
create policy "rides_update_own" on public.rides
  for update to authenticated using (driver_id = auth.uid()) with check (driver_id = auth.uid());

drop policy if exists "rides_delete_own" on public.rides;
create policy "rides_delete_own" on public.rides
  for delete to authenticated using (driver_id = auth.uid());

-- --- reservations -----------------------------------------------------------
-- Visible to the passenger who made it and to the driver of the ride.
drop policy if exists "reservations_select" on public.reservations;
create policy "reservations_select" on public.reservations
  for select to authenticated using (
    passenger_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.id = reservations.ride_id and r.driver_id = auth.uid()
    )
  );

-- A passenger can request a seat on someone else's open ride (not their own).
drop policy if exists "reservations_insert_passenger" on public.reservations;
create policy "reservations_insert_passenger" on public.reservations
  for insert to authenticated with check (
    passenger_id = auth.uid()
    and exists (
      select 1 from public.rides r
      where r.id = ride_id
        and r.driver_id <> auth.uid()
        and r.status = 'open'
        and r.available_seats > 0
    )
  );

-- Passenger can cancel their own; driver can accept/reject on their ride.
drop policy if exists "reservations_update" on public.reservations;
create policy "reservations_update" on public.reservations
  for update to authenticated using (
    passenger_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.id = reservations.ride_id and r.driver_id = auth.uid()
    )
  ) with check (
    passenger_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.id = reservations.ride_id and r.driver_id = auth.uid()
    )
  );

-- --- notifications ----------------------------------------------------------
-- Rows are created by SECURITY DEFINER triggers; users can only read/update
-- (mark read) their own.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- reviews ----------------------------------------------------------------
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews
  for select to authenticated using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check (author_id = auth.uid());
