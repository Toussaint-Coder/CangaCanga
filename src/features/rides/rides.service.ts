import { supabase } from "@/services/supabase";
import { getRoute } from "@/services/mapbox";
import type {
  Coordinates,
  NearbyRide,
  Place,
  Ride,
  RideWithDriver,
} from "@/types/models";

const DRIVER_SELECT =
  "driver:profiles!rides_driver_id_fkey(id, full_name, profile_picture, rating, vehicle_plate_number, phone_number)";

const RIDE_WITH_DRIVER = `*, ${DRIVER_SELECT}`;

export interface CreateRideInput {
  pickup: Place;
  destination: Place;
  departureTime: string; // ISO
  availableSeats: number;
  price: number;
  note?: string;
  vehiclePictureUrl?: string;
}

export async function createRide(input: CreateRideInput): Promise<Ride> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in to create a ride.");

  // Best-effort route estimate (distance + duration). Non-fatal if Mapbox
  // is not configured yet.
  let distance_m: number | null = null;
  let duration_s: number | null = null;
  try {
    const route = await getRoute(
      { latitude: input.pickup.latitude, longitude: input.pickup.longitude },
      {
        latitude: input.destination.latitude,
        longitude: input.destination.longitude,
      },
    );
    if (route) {
      distance_m = route.distanceMeters;
      duration_s = route.durationSeconds;
    }
  } catch {
    /* ignore — estimate is optional */
  }

  const { data, error } = await supabase
    .from("rides")
    .insert({
      driver_id: auth.user.id,
      pickup_label: input.pickup.label,
      pickup_lat: input.pickup.latitude,
      pickup_lng: input.pickup.longitude,
      destination_label: input.destination.label,
      destination_lat: input.destination.latitude,
      destination_lng: input.destination.longitude,
      departure_time: input.departureTime,
      seats_total: input.availableSeats,
      available_seats: input.availableSeats,
      price: input.price,
      note: input.note?.trim() || null,
      vehicle_picture: input.vehiclePictureUrl ?? null,
      distance_m,
      duration_s,
      status: "open",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getRide(id: string): Promise<RideWithDriver | null> {
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_WITH_DRIVER)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as RideWithDriver;
}

export interface RideFilters {
  destination?: string;
  seats?: number;
  after?: string; // ISO — departure_time >= after
  limit?: number;
  offset?: number;
}

/** Browse open, upcoming rides (paginated). */
export async function listRides(
  filters: RideFilters = {},
): Promise<RideWithDriver[]> {
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from("rides")
    .select(RIDE_WITH_DRIVER)
    .eq("status", "open")
    .gt("available_seats", 0)
    .gte("departure_time", filters.after ?? new Date().toISOString())
    .order("departure_time", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.destination) {
    query = query.ilike("destination_label", `%${filters.destination}%`);
  }
  if (filters.seats) {
    query = query.gte("available_seats", filters.seats);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RideWithDriver[];
}

/** Nearby open rides via the `nearby_rides` RPC, joined with driver profiles. */
export async function getNearbyRides(
  location: Coordinates,
  radiusMeters = 30000,
): Promise<NearbyRide[]> {
  const { data, error } = await supabase.rpc("nearby_rides", {
    p_lat: location.latitude,
    p_lng: location.longitude,
    p_radius_m: radiusMeters,
    p_limit: 50,
  });
  if (error) throw error;

  const rides = (data ?? []) as NearbyRide[];
  if (rides.length === 0) return rides;

  const driverIds = [...new Set(rides.map((r) => r.driver_id))];
  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name, profile_picture, rating, vehicle_plate_number, phone_number")
    .in("id", driverIds);

  const byId = new Map((drivers ?? []).map((d) => [d.id, d]));
  return rides.map((r) => ({ ...r, driver: byId.get(r.driver_id) }));
}

export async function getMyRidesAsDriver(): Promise<RideWithDriver[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_WITH_DRIVER)
    .eq("driver_id", auth.user.id)
    .order("departure_time", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as RideWithDriver[];
}

export async function cancelRide(rideId: string): Promise<void> {
  const { error } = await supabase
    .from("rides")
    .update({ status: "cancelled" })
    .eq("id", rideId);
  if (error) throw error;
}

export async function updateRideStatus(
  rideId: string,
  status: Ride["status"],
): Promise<void> {
  const { error } = await supabase
    .from("rides")
    .update({ status })
    .eq("id", rideId);
  if (error) throw error;
}
