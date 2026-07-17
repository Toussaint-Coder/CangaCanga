import { supabase } from "@/services/supabase";
import type {
  Reservation,
  ReservationWithRelations,
} from "@/types/models";

const PASSENGER_SELECT =
  "passenger:profiles!reservations_passenger_id_fkey(id, full_name, profile_picture, rating, phone_number)";

const RIDE_SELECT =
  "ride:rides!reservations_ride_id_fkey(*, driver:profiles!rides_driver_id_fkey(id, full_name, profile_picture, rating, vehicle_plate_number))";

/** Passenger requests a seat. Driver is notified via a DB trigger + realtime. */
export async function reserveSeat(
  rideId: string,
  seats = 1,
): Promise<Reservation> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in to reserve a seat.");

  const { data, error } = await supabase
    .from("reservations")
    .insert({ ride_id: rideId, passenger_id: auth.user.id, seats })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already requested a seat on this ride.");
    }
    throw error;
  }
  return data;
}

/** Reservations for a ride (driver view). */
export async function getReservationsForRide(
  rideId: string,
): Promise<ReservationWithRelations[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select(`*, ${PASSENGER_SELECT}, ${RIDE_SELECT}`)
    .eq("ride_id", rideId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ReservationWithRelations[];
}

/** Driver accepts or rejects a request. Passenger is notified via trigger. */
export async function respondToReservation(
  reservationId: string,
  accept: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", reservationId);
  if (error) throw error;
}

/** Reservations the current user made (passenger view). */
export async function getMyReservations(): Promise<ReservationWithRelations[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from("reservations")
    .select(`*, ${PASSENGER_SELECT}, ${RIDE_SELECT}`)
    .eq("passenger_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ReservationWithRelations[];
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);
  if (error) throw error;
}
