-- ============================================================================
-- CangaCanga — 0005 push notifications
-- Stores per-device Expo push tokens and fans out a push message whenever a
-- notification row is created, so users are notified while the app is
-- backgrounded or killed (foreground/in-app delivery is handled client-side by
-- the Supabase Realtime subscription).
-- ============================================================================

-- --- device tokens ----------------------------------------------------------
create table if not exists public.device_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null unique,
  platform   text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_device_tokens_user on public.device_tokens(user_id);

drop trigger if exists trg_device_tokens_updated on public.device_tokens;
create trigger trg_device_tokens_updated before update on public.device_tokens
  for each row execute function public.set_updated_at();

-- --- RLS: users manage only their own tokens --------------------------------
alter table public.device_tokens enable row level security;

drop policy if exists "device_tokens_select_own" on public.device_tokens;
create policy "device_tokens_select_own" on public.device_tokens
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "device_tokens_insert_own" on public.device_tokens;
create policy "device_tokens_insert_own" on public.device_tokens
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "device_tokens_update_own" on public.device_tokens;
create policy "device_tokens_update_own" on public.device_tokens
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "device_tokens_delete_own" on public.device_tokens;
create policy "device_tokens_delete_own" on public.device_tokens
  for delete to authenticated using (user_id = auth.uid());

-- --- fan-out to the send-push Edge Function ---------------------------------
-- Uses pg_net to POST the freshly inserted notification to the Edge Function,
-- which looks up the recipient's device tokens and calls the Expo Push API.
--
-- Configure once (values are NOT committed) so the trigger knows where to call
-- and can authenticate as service role:
--   alter database postgres
--     set app.settings.edge_url = 'https://<project-ref>.supabase.co';
--   alter database postgres
--     set app.settings.service_role_key = '<service-role-key>';
--
-- If these settings are absent the trigger is a no-op, so notification inserts
-- never fail because push infrastructure isn't configured yet.
create extension if not exists pg_net;

create or replace function public.notify_push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := current_setting('app.settings.edge_url', true);
  v_key text := current_setting('app.settings.service_role_key', true);
begin
  if v_url is null or v_url = '' or v_key is null or v_key = '' then
    return new;
  end if;

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
  -- Never let push delivery break the core notification insert.
  return new;
end;
$$;

drop trigger if exists trg_notification_push on public.notifications;
create trigger trg_notification_push after insert on public.notifications
  for each row execute function public.notify_push_on_notification();
