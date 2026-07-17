import Constants, { ExecutionEnvironment } from "expo-constants";

import { env, isMapboxConfigured } from "@/config/env";

/**
 * `@rnmapbox/maps` ships native code that is NOT available in Expo Go. When the
 * app runs in Expo Go we skip the module entirely and let callers fall back to
 * a placeholder. In a development/production build the native module loads
 * normally.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Mapbox: any = null;

if (!isExpoGo) {
  // Guarded require so Metro never executes native-only code inside Expo Go.
  Mapbox = require("@rnmapbox/maps").default;
}

/** True when the native Mapbox module is actually available to render maps. */
export const isMapboxAvailable = Boolean(Mapbox);

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
export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
