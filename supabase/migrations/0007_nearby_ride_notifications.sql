-- ============================================================================
-- CangaCanga — 0007 nearby ride notifications + push reliability
-- 1) Store each user's last known location for proximity alerts
-- 2) Notify nearby users when a new open ride is created
-- 3) Reliable device-token upsert (claim token across accounts)
-- 4) Push fan-out: read Vault secrets, then fall back to app.settings
-- ============================================================================

-- --- enum: nearby_ride ------------------------------------------------------
do $$ begin
  alter type public.notification_type add value if not exists 'nearby_ride';
exception
  when duplicate_object then null;
end $$;

-- --- profiles: last known location ------------------------------------------
alter table public.profiles
  add column if not exists last_lat double precision,
  add column if not exists last_lng double precision,
  add column if not exists last_location_at timestamptz;

create index if not exists profiles_last_location_idx
  on public.profiles (last_location_at)
  where last_lat is not null and last_lng is not null;

-- --- claim / upsert device token (SECURITY DEFINER) -------------------------
-- Client RLS update fails when the token row belongs to a previous user on a
-- shared device. This RPC always binds the token to auth.uid().
create or replace function public.upsert_device_token(
  p_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_platform not in ('ios', 'android', 'web') then
    raise exception 'invalid platform';
  end if;

  insert into public.device_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (token) do update
    set user_id = auth.uid(),
        platform = excluded.platform,
        updated_at = now();
end;
$$;

revoke all on function public.upsert_device_token(text, text) from public;
grant execute on function public.upsert_device_token(text, text) to authenticated;

-- --- update own last known location ----------------------------------------
create or replace function public.update_my_location(
  p_lat double precision,
  p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set last_lat = p_lat,
      last_lng = p_lng,
      last_location_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.update_my_location(double precision, double precision) from public;
grant execute on function public.update_my_location(double precision, double precision) to authenticated;

-- --- notify nearby users when a ride is created -----------------------------
-- Radius matches the client nearby_rides default (30 km). Only users with a
-- location updated in the last 7 days are notified. The driver is skipped.
create or replace function public.on_ride_created_notify_nearby()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_radius_m double precision := 30000;
  v_km text;
begin
  if new.status is distinct from 'open' then
    return new;
  end if;

  for r in
    select p.id,
           public.haversine_m(p.last_lat, p.last_lng, new.pickup_lat, new.pickup_lng) as dist_m
    from public.profiles p
    where p.id <> new.driver_id
      and p.last_lat is not null
      and p.last_lng is not null
      and p.last_location_at is not null
      and p.last_location_at > now() - interval '7 days'
      and public.haversine_m(p.last_lat, p.last_lng, new.pickup_lat, new.pickup_lng) <= v_radius_m
  loop
    v_km := to_char(round((r.dist_m / 1000.0)::numeric, 1), 'FM999990.0');
    perform public.push_notification(
      r.id,
      'nearby_ride',
      'New ride nearby',
      'A ride to ' || coalesce(new.destination_label, 'a destination') ||
        ' is about ' || v_km || ' km from you.',
      jsonb_build_object(
        'ride_id', new.id,
        'distance_m', round(r.dist_m)::int
      )
    );
  end loop;

  return new;
exception when others then
  -- Never block ride creation because of notification fan-out.
  return new;
end;
$$;

drop trigger if exists trg_ride_created_nearby on public.rides;
create trigger trg_ride_created_nearby
  after insert on public.rides
  for each row execute function public.on_ride_created_notify_nearby();

-- --- push fan-out: Vault first, then app.settings ---------------------------
-- Configure once (pick ONE approach):
--
-- A) Vault (preferred on hosted Supabase):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'cangacanga_edge_url');
--   select vault.create_secret('<service-role-key>', 'cangacanga_service_role_key');
--
-- B) Database settings (legacy):
--   alter database postgres set app.settings.edge_url = 'https://<project-ref>.supabase.co';
--   alter database postgres set app.settings.service_role_key = '<service-role-key>';
--
-- Then deploy: supabase functions deploy send-push
create or replace function public.notify_push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_key text;
begin
  -- Vault secrets (ignore errors if vault is unavailable).
  begin
    select ds.decrypted_secret into v_url
    from vault.decrypted_secrets ds
    where ds.name = 'cangacanga_edge_url'
    limit 1;
  exception when others then
    v_url := null;
  end;

  begin
    select ds.decrypted_secret into v_key
    from vault.decrypted_secrets ds
    where ds.name = 'cangacanga_service_role_key'
    limit 1;
  exception when others then
    v_key := null;
  end;

  if v_url is null or v_url = '' then
    v_url := current_setting('app.settings.edge_url', true);
  end if;
  if v_key is null or v_key = '' then
    v_key := current_setting('app.settings.service_role_key', true);
  end if;

  if v_url is null or v_url = '' or v_key is null or v_key = '' then
    return new;
  end if;

  -- Trim trailing slash so we never produce '//functions'.
  v_url := rtrim(v_url, '/');

  perform net.http_post(
    url := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );

  return new;
exception when others then
  return new;
end;
$$;
