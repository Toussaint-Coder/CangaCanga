-- ============================================================================
-- CangaCanga — 0006 ride vehicle picture
-- Optional photo of the vehicle shown for a published ride.
-- ============================================================================

alter table public.rides
  add column if not exists vehicle_picture text;

comment on column public.rides.vehicle_picture is
  'Public URL of the vehicle photo uploaded when the ride was created.';
