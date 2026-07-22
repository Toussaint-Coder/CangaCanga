import type {
  ProfileRow,
  RideRow,
  ReservationRow,
  NotificationRow,
  ReviewRow,
  NearbyRideRow,
  DeviceTokenRow,
} from "./database";

export type Profile = ProfileRow;
export type Ride = RideRow;
export type Reservation = ReservationRow;
export type AppNotification = NotificationRow;
export type Review = ReviewRow;
export type DeviceToken = DeviceTokenRow;

/** A ride joined with its driver's public profile — used across the UI. */
export interface RideWithDriver extends RideRow {
  driver: Pick<
    ProfileRow,
    | "id"
    | "full_name"
    | "profile_picture"
    | "rating"
    | "vehicle_plate_number"
    | "phone_number"
  >;
  distance_from_me?: number;
}

export interface NearbyRide extends NearbyRideRow {
  driver?: Pick<
    ProfileRow,
    | "id"
    | "full_name"
    | "profile_picture"
    | "rating"
    | "vehicle_plate_number"
    | "phone_number"
  >;
}

/** A reservation joined with the ride + the passenger's profile. */
export interface ReservationWithRelations extends ReservationRow {
  ride: RideWithDriver;
  passenger: Pick<
    ProfileRow,
    "id" | "full_name" | "profile_picture" | "rating" | "phone_number"
  >;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  label: string;
  latitude: number;
  longitude: number;
}
