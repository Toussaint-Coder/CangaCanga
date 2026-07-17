import * as Location from "expo-location";

import { persist, STORAGE_KEYS } from "@/lib/storage";
import type { Coordinates } from "@/types/models";

// Default center (Bujumbura) used when permission is denied / unavailable.
export const DEFAULT_LOCATION: Coordinates = {
  latitude: -3.3614,
  longitude: 29.3599,
};

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
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
