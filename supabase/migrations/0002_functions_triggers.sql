-- ============================================================================
-- CangaCanga — 0002 functions & triggers
-- Business logic that mirrors the "controllers": auto-notifications, seat
-- accounting, rating recomputation and updated_at maintenance.
-- ============================================================================

-- --- updated_at maintenance -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_rides_updated on public.rides;
create trigger trg_rides_updated before update on public.rides
  for each row execute function public.set_updated_at();

drop trigger if exists trg_reservations_updated on public.reservations;
create trigger trg_reservations_updated before update on public.reservations
  for each row execute function public.set_updated_at();

-- --- helper to insert a notification ----------------------------------------
create or replace function public.push_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user_id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb));
end;
$$;

-- --- reservation created -> notify the ride driver --------------------------
create or replace function public.on_reservation_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_driver uuid;
  v_passenger text;
  v_dest text;
begin
  select r.driver_id, r.destination_label into v_driver, v_dest
  from public.rides r where r.id = new.ride_id;

  select p.full_name into v_passenger
  from public.profiles p where p.id = new.passenger_id;

  perform public.push_notification(
    v_driver,
    'reservation_requested',
    'New reservation request',
    coalesce(v_passenger, 'Someone') || ' wants a seat to ' || coalesce(v_dest, 'your destination'),
    jsonb_build_object('ride_id', new.ride_id, 'reservation_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_reservation_created on public.reservations;
create trigger trg_reservation_created after insert on public.reservations
  for each row execute function public.on_reservation_created();

-- --- reservation status changed -> notify passenger + adjust seats ----------
create or replace function public.on_reservation_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dest text;
begin
  if new.status = old.status then
    return new;
  end if;

  select destination_label into v_dest from public.rides where id = new.ride_id;

  if new.status = 'accepted' then
    update public.rides
      set available_seats = greatest(available_seats - new.seats, 0)
      where id = new.ride_id;

    update public.rides
      set status = 'full'
      where id = new.ride_id and available_seats = 0 and status = 'open';

    perform public.push_notification(
      new.passenger_id, 'reservation_accepted',
      'Reservation accepted',
      'Your seat to ' || coalesce(v_dest, 'the destination') || ' was accepted.',
      jsonb_build_object('ride_id', new.ride_id, 'reservation_id', new.id)
    );

  elsif new.status = 'rejected' then
    perform public.push_notification(
      new.passenger_id, 'reservation_rejected',
      'Reservation declined',
      'Your seat request to ' || coalesce(v_dest, 'the destination') || ' was declined.',
      jsonb_build_object('ride_id', new.ride_id, 'reservation_id', new.id)
    );

  elsif new.status = 'cancelled' and old.status = 'accepted' then
    -- passenger cancelled a confirmed seat: give the seat back.
    update public.rides
      set available_seats = available_seats + new.seats,
          status = case when status = 'full' then 'open' else status end
      where id = new.ride_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reservation_status on public.reservations;
create trigger trg_reservation_status after update on public.reservations
  for each row execute function public.on_reservation_status_changed();

-- --- ride cancelled -> notify all active passengers -------------------------
create or replace function public.on_ride_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    for r in
      select passenger_id from public.reservations
      where ride_id = new.id and status in ('pending', 'accepted')
    loop
      perform public.push_notification(
        r.passenger_id, 'ride_cancelled',
        'Ride cancelled',
        'A ride you reserved to ' || new.destination_label || ' was cancelled.',
        jsonb_build_object('ride_id', new.id)
      );
    end loop;

    update public.reservations
      set status = 'cancelled'
      where ride_id = new.id and status in ('pending', 'accepted');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ride_cancelled on public.rides;
create trigger trg_ride_cancelled after update on public.rides
  for each row execute function public.on_ride_cancelled();

-- --- review inserted -> recompute receiver rating ---------------------------
create or replace function public.on_review_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set rating = sub.avg_rating,
      rating_count = sub.cnt
  from (
    select avg(rating)::numeric(3,2) as avg_rating, count(*) as cnt
    from public.reviews where receiver_id = new.receiver_id
  ) sub
  where p.id = new.receiver_id;
  return new;
end;
$$;

drop trigger if exists trg_review_created on public.reviews;
create trigger trg_review_created after insert on public.reviews
  for each row execute function public.on_review_created();
