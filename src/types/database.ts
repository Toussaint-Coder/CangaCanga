/**
 * Hand-written Supabase schema types (mirrors supabase/migrations).
 * Shaped to satisfy supabase-js's GenericSchema so inserts/updates are typed.
 *
 * NOTE: these MUST be `type` aliases (not `interface`) — interfaces are not
 * assignable to `Record<string, unknown>`, which would make supabase-js fall
 * back to `Schema = never` and type every insert/update as `never`.
 *
 * Regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type RideStatus =
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ReservationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type NotificationType =
  | "reservation_requested"
  | "reservation_accepted"
  | "reservation_rejected"
  | "ride_cancelled"
  | "ride_reminder"
  | "nearby_ride";

export type ProfileRow = {
  id: string;
  full_name: string;
  phone_number: string;
  profile_picture: string | null;
  vehicle_plate_number: string | null;
  rating: number;
  rating_count: number;
  last_lat: number | null;
  last_lng: number | null;
  last_location_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RideRow = {
  id: string;
  driver_id: string;
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_label: string;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  seats_total: number;
  available_seats: number;
  price: number;
  note: string | null;
  status: RideStatus;
  distance_m: number | null;
  duration_s: number | null;
  vehicle_picture: string | null;
  created_at: string;
  updated_at: string;
};

export type ReservationRow = {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats: number;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  author_id: string;
  receiver_id: string;
  ride_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type DevicePlatform = "ios" | "android" | "web";

export type DeviceTokenRow = {
  id: string;
  user_id: string;
  token: string;
  platform: DevicePlatform;
  created_at: string;
  updated_at: string;
};

export type NearbyRideRow = Omit<RideRow, "updated_at"> & {
  distance_from_me: number;
};

// --- Insert shapes (generated columns / defaults are optional) -------------
type ProfileInsert = {
  id: string;
  full_name: string;
  phone_number: string;
  profile_picture?: string | null;
  vehicle_plate_number?: string | null;
  rating?: number;
  rating_count?: number;
  last_lat?: number | null;
  last_lng?: number | null;
  last_location_at?: string | null;
  last_seen_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type RideInsert = {
  id?: string;
  driver_id: string;
  pickup_label: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_label: string;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  seats_total: number;
  available_seats: number;
  price?: number;
  note?: string | null;
  status?: RideStatus;
  distance_m?: number | null;
  duration_s?: number | null;
  vehicle_picture?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ReservationInsert = {
  id?: string;
  ride_id: string;
  passenger_id: string;
  seats?: number;
  status?: ReservationStatus;
  created_at?: string;
  updated_at?: string;
};

type NotificationInsert = {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read?: boolean;
  created_at?: string;
};

type ReviewInsert = {
  id?: string;
  author_id: string;
  receiver_id: string;
  ride_id?: string | null;
  rating: number;
  comment?: string | null;
  created_at?: string;
};

type DeviceTokenInsert = {
  id?: string;
  user_id: string;
  token: string;
  platform: DevicePlatform;
  created_at?: string;
  updated_at?: string;
};

type TableDef<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, ProfileInsert>;
      rides: TableDef<RideRow, RideInsert>;
      reservations: TableDef<ReservationRow, ReservationInsert>;
      notifications: TableDef<NotificationRow, NotificationInsert>;
      reviews: TableDef<ReviewRow, ReviewInsert>;
      device_tokens: TableDef<DeviceTokenRow, DeviceTokenInsert>;
    };
    Views: Record<string, never>;
    Functions: {
      nearby_rides: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_radius_m?: number;
          p_limit?: number;
        };
        Returns: NearbyRideRow[];
      };
      upsert_device_token: {
        Args: { p_token: string; p_platform: string };
        Returns: undefined;
      };
      update_my_location: {
        Args: { p_lat: number; p_lng: number };
        Returns: undefined;
      };
      touch_my_presence: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      ride_status: RideStatus;
      reservation_status: ReservationStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
};
