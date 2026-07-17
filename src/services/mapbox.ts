import axios from "axios";

import { env, isMapboxConfigured } from "@/config/env";
import type { Coordinates, Place } from "@/types/models";

/**
 * Thin wrapper around the Mapbox REST APIs used by the app:
 * forward/reverse geocoding and driving directions (distance, duration,
 * route polyline as GeoJSON).
 */

const GEOCODE_BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const DIRECTIONS_BASE = "https://api.mapbox.com/directions/v5/mapbox/driving";

// Bias results toward Burundi.
const BURUNDI_BBOX = "28.98,-4.47,30.85,-2.30";
const BUJUMBURA: Coordinates = { latitude: -3.3614, longitude: 29.3599 };

const client = axios.create({ timeout: 12000 });

export interface GeocodeResult extends Place {
  id: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  /** [lng, lat] pairs — Mapbox GeoJSON order. */
  coordinates: [number, number][];
}

function ensureConfigured() {
  if (!isMapboxConfigured()) {
    throw new Error(
      "Mapbox is not configured. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.",
    );
  }
}

/** Search places by text, biased to Burundi. */
export async function forwardGeocode(
  query: string,
  proximity?: Coordinates,
): Promise<GeocodeResult[]> {
  ensureConfigured();
  if (!query.trim()) return [];

  const prox = proximity
    ? `${proximity.longitude},${proximity.latitude}`
    : `${BUJUMBURA.longitude},${BUJUMBURA.latitude}`;

  const { data } = await client.get(
    `${GEOCODE_BASE}/${encodeURIComponent(query)}.json`,
    {
      params: {
        access_token: env.mapbox.accessToken,
        bbox: BURUNDI_BBOX,
        proximity: prox,
        limit: 6,
        language: "fr",
      },
    },
  );

  return (data.features ?? []).map((f: any) => ({
    id: f.id,
    label: f.place_name as string,
    longitude: f.center[0] as number,
    latitude: f.center[1] as number,
  }));
}

/** Turn coordinates into a human-readable place label. */
export async function reverseGeocode(
  coords: Coordinates,
): Promise<string | null> {
  ensureConfigured();
  const { data } = await client.get(
    `${GEOCODE_BASE}/${coords.longitude},${coords.latitude}.json`,
    {
      params: {
        access_token: env.mapbox.accessToken,
        limit: 1,
        language: "fr",
      },
    },
  );
  return data.features?.[0]?.place_name ?? null;
}

/** Driving route between two points. */
export async function getRoute(
  from: Coordinates,
  to: Coordinates,
): Promise<RouteResult | null> {
  ensureConfigured();
  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const { data } = await client.get(`${DIRECTIONS_BASE}/${coords}`, {
    params: {
      access_token: env.mapbox.accessToken,
      geometries: "geojson",
      overview: "full",
      steps: false,
    },
  });

  const route = data.routes?.[0];
  if (!route) return null;

  return {
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    coordinates: route.geometry.coordinates as [number, number][],
  };
}
