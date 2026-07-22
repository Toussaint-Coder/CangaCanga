import * as Location from "expo-location";

import { persist, STORAGE_KEYS } from "@/lib/storage";
import { supabase } from "@/services/supabase";
import type { Coordinates } from "@/types/models";

// Default center (Bujumbura) used when permission is denied / unavailable.
export const DEFAULT_LOCATION: Coordinates = {
  latitude: -3.3614,
  longitude: 29.3599,
};

/** Avoid spamming the profiles table on every location read. */
const LOCATION_SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000;
let lastSyncedAt = 0;
let lastSyncedKey = "";

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

/**
 * Persists the user's last known coordinates on their profile so the server
 * can fan out "nearby ride" notifications while the app is closed.
 */
export async function syncMyLocation(coords: Coordinates): Promise<void> {
  const key = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  const now = Date.now();
  if (
    key === lastSyncedKey &&
    now - lastSyncedAt < LOCATION_SYNC_MIN_INTERVAL_MS
  ) {
    return;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { error } = await supabase.rpc("update_my_location", {
    p_lat: coords.latitude,
    p_lng: coords.longitude,
  });
  if (error) {
    // Fallback while migration 0007 is not yet applied.
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        last_lat: coords.latitude,
        last_lng: coords.longitude,
        last_location_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);
    if (updateError) {
      if (__DEV__) console.warn("[location] syncMyLocation failed", updateError);
      return;
    }
  }
  lastSyncedAt = now;
  lastSyncedKey = key;
}

export async function getCurrentLocation(): Promise<Coordinates> {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return getCachedOrDefault();

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords: Coordinates = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    await persist.set(STORAGE_KEYS.lastKnownLocation, coords);
    void syncMyLocation(coords);
    return coords;
  } catch {
    return getCachedOrDefault();
  }
}

async function getCachedOrDefault(): Promise<Coordinates> {
  return (
    (await persist.get<Coordinates>(STORAGE_KEYS.lastKnownLocation)) ??
    DEFAULT_LOCATION
  );
}
