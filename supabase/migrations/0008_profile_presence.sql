-- ============================================================================
-- CangaCanga — 0008 profile presence (online / offline)
-- last_seen_at is refreshed while the app is open; clients treat a recent
-- timestamp as "online".
-- ============================================================================

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen_at desc nulls last);

comment on column public.profiles.last_seen_at is
  'Updated by the client while the app is foregrounded; used for online/offline.';

create or replace function public.touch_my_presence()
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
  set last_seen_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.touch_my_presence() from public;
grant execute on function public.touch_my_presence() to authenticated;
