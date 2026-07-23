import { persist, STORAGE_KEYS } from "@/lib/storage";
import { uploadVehiclePicture } from "@/services/r2";
import type { Place } from "@/types/models";

export const MAX_SEATS = 99;

export function isRemoteUrl(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

/** Upload only when the user picked a new local photo. */
export async function resolveVehiclePictureUrl(
  vehicleUri: string,
  userId: string,
  vehicleMime: string | null,
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (isRemoteUrl(vehicleUri)) return vehicleUri;
  const url = await uploadVehiclePicture(
    vehicleUri,
    userId,
    vehicleMime,
    onProgress,
  );
  await saveVehiclePictureUrl(url);
  return url;
}

/** A frequently used pickup → destination pair with optional defaults. */
export interface SavedRoute {
  id: string;
  pickup: Place;
  destination: Place;
  seats?: number;
  price?: number;
  note?: string;
  usedCount: number;
  lastUsedAt: string;
}

function routeKey(pickup: Place, destination: Place): string {
  return [
    pickup.label.trim().toLowerCase(),
    pickup.latitude.toFixed(4),
    pickup.longitude.toFixed(4),
    destination.label.trim().toLowerCase(),
    destination.latitude.toFixed(4),
    destination.longitude.toFixed(4),
  ].join("|");
}

export async function getSavedVehiclePictureUrl(): Promise<string | null> {
  return persist.get<string>(STORAGE_KEYS.driverVehiclePicture);
}

export async function saveVehiclePictureUrl(url: string): Promise<void> {
  await persist.set(STORAGE_KEYS.driverVehiclePicture, url);
}

export async function getSavedRoutes(): Promise<SavedRoute[]> {
  const routes = await persist.get<SavedRoute[]>(STORAGE_KEYS.savedRoutes);
  return routes ?? [];
}

/** Remember a route after a successful create/update. Most-used routes bubble up. */
export async function rememberRoute(input: {
  pickup: Place;
  destination: Place;
  seats?: number;
  price?: number;
  note?: string;
}): Promise<void> {
  const key = routeKey(input.pickup, input.destination);
  const existing = await getSavedRoutes();
  const now = new Date().toISOString();
  const idx = existing.findIndex((r) => routeKey(r.pickup, r.destination) === key);

  let next: SavedRoute[];
  if (idx >= 0) {
    const prev = existing[idx];
    const updated: SavedRoute = {
      ...prev,
      pickup: input.pickup,
      destination: input.destination,
      seats: input.seats ?? prev.seats,
      price: input.price ?? prev.price,
      note: input.note?.trim() || prev.note,
      usedCount: prev.usedCount + 1,
      lastUsedAt: now,
    };
    next = [updated, ...existing.filter((_, i) => i !== idx)];
  } else {
    next = [
      {
        id: key,
        pickup: input.pickup,
        destination: input.destination,
        seats: input.seats,
        price: input.price,
        note: input.note?.trim() || undefined,
        usedCount: 1,
        lastUsedAt: now,
      },
      ...existing,
    ];
  }

  await persist.set(STORAGE_KEYS.savedRoutes, next.slice(0, 12));
}
