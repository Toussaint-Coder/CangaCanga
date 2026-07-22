import Constants, { ExecutionEnvironment } from "expo-constants";

import { env, isMapboxConfigured } from "@/config/env";

/**
 * `@rnmapbox/maps` ships native code that is NOT available in Expo Go. When the
 * app runs in Expo Go we skip the module entirely and let callers fall back to
 * a placeholder. In a development/production build the native module loads
 * normally.
 *
 * NOTE: Maps only render in a *development build* (`npm run android` / EAS),
 * never in Expo Go — that's a hard platform limitation of native modules, not a
 * bug.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Mapbox: any = null;

if (!isExpoGo) {
  // Guarded require so Metro never executes native-only code inside Expo Go.
  // Wrapped defensively so a missing/misconfigured native module falls back to
  // the placeholder instead of crashing the whole screen.
  try {
    const mod = require("@rnmapbox/maps");
    Mapbox = mod?.default ?? mod ?? null;
  } catch {
    Mapbox = null;
  }
}

/** True when the native Mapbox module is actually available to render maps. */
export const isMapboxAvailable = Boolean(Mapbox?.MapView);

let initialised = false;

/**
 * Initialise the Mapbox SDK once. Safe to import from multiple places and a
 * no-op when running in Expo Go.
 */
export function initMapbox() {
  if (initialised || !isMapboxAvailable) return;
  if (isMapboxConfigured()) {
    Mapbox.setAccessToken(env.mapbox.accessToken);
    initialised = true;
  }
}

export { Mapbox };

/** Default street / light style used across most screens. */
export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

/** Satellite with road labels — default on Explore. */
export const MAP_STYLE_SATELLITE =
  "mapbox://styles/mapbox/satellite-streets-v12";

export type MapStyleKind = "street" | "satellite";

export function mapStyleUrl(kind: MapStyleKind): string {
  return kind === "satellite" ? MAP_STYLE_SATELLITE : MAP_STYLE;
}
