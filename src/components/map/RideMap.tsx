import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/Icon";
import { isMapboxConfigured } from "@/config/env";
import { fonts, useThemeColors } from "@/theme";
import type { Coordinates } from "@/types/models";
import { initMapbox, isMapboxAvailable, Mapbox, MAP_STYLE } from "./mapbox";

export interface RideMarker {
  id: string;
  coordinate: Coordinates;
  label?: string;
}

interface RideMapProps {
  center?: Coordinates;
  markers?: RideMarker[];
  pickup?: Coordinates;
  destination?: Coordinates;
  routeCoordinates?: [number, number][]; // [lng, lat] GeoJSON order
  zoom?: number;
  showUserLocation?: boolean;
  /** Keep the camera on `center` as it updates (e.g. live navigation). */
  followCenter?: boolean;
  /** Fixed height. Omit (or pass with `fill`) to stretch with flex:1. */
  height?: number;
  /** Stretch to fill the parent (use inside a `flex-1` container). */
  fill?: boolean;
  rounded?: boolean;
  /** Mapbox style URL. Defaults to the light street style. */
  styleURL?: string;
  /** Highlight this ride marker (larger circle). */
  selectedMarkerId?: string;
  onMarkerPress?: (id: string) => void;
  /** Called when the user taps empty map area (for place picking). */
  onCoordinatePress?: (coord: Coordinates) => void;
}

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id?: string;
    properties: Record<string, string>;
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

/**
 * Mapbox map using ShapeSource/CircleLayer only (no PointAnnotation /
 * UserLocation). Those embed RN views and trip ViewTagResolver on Android.
 */
export function RideMap({
  center,
  markers = [],
  pickup,
  destination,
  routeCoordinates,
  zoom = 12,
  showUserLocation = true,
  followCenter = false,
  height = 220,
  fill = false,
  rounded = true,
  styleURL = MAP_STYLE,
  selectedMarkerId,
  onMarkerPress,
  onCoordinatePress,
}: RideMapProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [mapReady, setMapReady] = useState(false);
  // Snapshot the first usable center so Camera is not driven every GPS tick
  // (continuous setCamera → ViewTagResolver races).
  const initialCenterRef = useRef<Coordinates>(
    center ?? pickup ?? { latitude: -3.3614, longitude: 29.3599 },
  );
  const [cameraCenter, setCameraCenter] = useState<Coordinates>(
    initialCenterRef.current,
  );
  const didFollowGps = useRef(false);

  useEffect(() => {
    initMapbox();
  }, []);

  useEffect(() => {
    setMapReady(false);
  }, [styleURL]);

  useEffect(() => {
    return () => setMapReady(false);
  }, []);

  // Follow GPS once when it first arrives (home / explore).
  useEffect(() => {
    if (!center || didFollowGps.current) return;
    didFollowGps.current = true;
    initialCenterRef.current = center;
    setCameraCenter(center);
  }, [center]);

  // Live navigation: keep camera on the moving user.
  useEffect(() => {
    if (!followCenter || !center) return;
    setCameraCenter(center);
  }, [followCenter, center]);

  // When picking on the map, keep the camera on the dropped pin.
  useEffect(() => {
    if (!pickup || !onCoordinatePress) return;
    setCameraCenter(pickup);
  }, [pickup, onCoordinatePress]);

  // Center between pickup and destination on ride detail (not place-picking).
  useEffect(() => {
    if (followCenter) return;
    if (!pickup || !destination || onCoordinatePress) return;
    setCameraCenter({
      latitude: (pickup.latitude + destination.latitude) / 2,
      longitude: (pickup.longitude + destination.longitude) / 2,
    });
  }, [pickup, destination, onCoordinatePress, followCenter]);

  const radius = rounded ? 20 : 0;
  const boxStyle = fill
    ? { flex: 1 as const, borderRadius: radius }
    : { height, borderRadius: radius };

  const rideCollection = useMemo<GeoJsonFeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: markers.map((m) => ({
        type: "Feature",
        id: m.id,
        properties: {
          id: m.id,
          kind: "ride",
          selected: m.id === selectedMarkerId ? "yes" : "no",
        },
        geometry: {
          type: "Point",
          coordinates: [m.coordinate.longitude, m.coordinate.latitude],
        },
      })),
    }),
    [markers, selectedMarkerId],
  );

  const pinCollection = useMemo<GeoJsonFeatureCollection>(() => {
    const features: GeoJsonFeatureCollection["features"] = [];
    if (pickup) {
      features.push({
        type: "Feature",
        id: "pickup",
        properties: { id: "pickup", kind: "pickup" },
        geometry: {
          type: "Point",
          coordinates: [pickup.longitude, pickup.latitude],
        },
      });
    }
    if (destination) {
      features.push({
        type: "Feature",
        id: "destination",
        properties: { id: "destination", kind: "destination" },
        geometry: {
          type: "Point",
          coordinates: [destination.longitude, destination.latitude],
        },
      });
    }
    return { type: "FeatureCollection", features };
  }, [pickup, destination]);

  if (!isMapboxAvailable || !isMapboxConfigured()) {
    return (
      <View
        style={boxStyle}
        className="items-center justify-center overflow-hidden border border-border bg-card"
      >
        <Icon name="place" size={26} color={colors.mutedLight} />
        <Text
          style={{ fontFamily: fonts.medium }}
          className="mt-2 text-sm text-muted"
        >
          {t("map.preview")}
        </Text>
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-0.5 text-xs text-mutedLight"
        >
          {!isMapboxAvailable ? t("map.needsDevBuild") : t("map.addToken")}
        </Text>
      </View>
    );
  }

  return (
    <View style={boxStyle} className="overflow-hidden">
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={styleURL}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onPress={(event: {
          coordinates?: { latitude: number; longitude: number };
          geometry?: { coordinates?: [number, number] };
          features?: unknown[];
        }) => {
          const hasFeatures = (event.features?.length ?? 0) > 0;
          if (hasFeatures && onMarkerPress) return;

          const fromCoords = event.coordinates;
          const fromGeom = event.geometry?.coordinates;
          if (fromCoords) {
            onCoordinatePress?.({
              latitude: fromCoords.latitude,
              longitude: fromCoords.longitude,
            });
            return;
          }
          if (fromGeom) {
            onCoordinatePress?.({
              longitude: fromGeom[0],
              latitude: fromGeom[1],
            });
          }
        }}
      >
        {/* Camera mounts only after the native map view exists. */}
        {mapReady ? (
          <Mapbox.Camera
            defaultSettings={{
              centerCoordinate: [
                initialCenterRef.current.longitude,
                initialCenterRef.current.latitude,
              ],
              zoomLevel: zoom,
            }}
            centerCoordinate={[cameraCenter.longitude, cameraCenter.latitude]}
            zoomLevel={zoom}
            animationMode="none"
            animationDuration={0}
          />
        ) : null}

        {mapReady ? (
          <>
            {showUserLocation && center ? (
              <Mapbox.ShapeSource
                id="user"
                shape={{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: [center.longitude, center.latitude],
                  },
                }}
              >
                <Mapbox.CircleLayer
                  id="user-halo"
                  style={{
                    circleRadius: 18,
                    circleColor: colors.accent,
                    circleOpacity: 0.2,
                  }}
                />
                <Mapbox.CircleLayer
                  id="user-dot"
                  style={{
                    circleRadius: 7,
                    circleColor: colors.accent,
                    circleStrokeWidth: 3,
                    circleStrokeColor: colors.secondary,
                  }}
                />
              </Mapbox.ShapeSource>
            ) : null}

            {routeCoordinates && routeCoordinates.length > 1 ? (
              <Mapbox.ShapeSource
                id="route"
                shape={{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: routeCoordinates,
                  },
                }}
              >
                <Mapbox.LineLayer
                  id="route-line"
                  style={{
                    lineColor: "#38BDF8",
                    lineWidth: 5,
                    lineCap: "round",
                    lineJoin: "round",
                    lineOpacity: 0.95,
                  }}
                />
              </Mapbox.ShapeSource>
            ) : null}

            {pinCollection.features.length > 0 ? (
              <Mapbox.ShapeSource id="pins" shape={pinCollection}>
                <Mapbox.CircleLayer
                  id="pins-circle"
                  style={{
                    circleRadius: 9,
                    circleColor: [
                      "match",
                      ["get", "kind"],
                      "pickup",
                      colors.accent,
                      "destination",
                      colors.primary,
                      colors.accent,
                    ],
                    circleStrokeWidth: 3,
                    circleStrokeColor: colors.secondary,
                  }}
                />
              </Mapbox.ShapeSource>
            ) : null}

            {rideCollection.features.length > 0 ? (
              <Mapbox.ShapeSource
                id="rides"
                shape={rideCollection}
                hitbox={{ width: 56, height: 56 }}
                onPress={(event: {
                  features?: Array<{ properties?: { id?: string } }>;
                }) => {
                  const id = event.features?.[0]?.properties?.id;
                  if (id) onMarkerPress?.(id);
                }}
              >
                <Mapbox.Images
                  images={{
                    "ride-car": require("../../../assets/markers/car.png"),
                  }}
                />
                <Mapbox.SymbolLayer
                  id="rides-car"
                  style={{
                    iconImage: "ride-car",
                    iconSize: [
                      "match",
                      ["get", "selected"],
                      "yes",
                      0.55,
                      0.42,
                    ],
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                    iconAnchor: "center",
                  }}
                />
              </Mapbox.ShapeSource>
            ) : null}
          </>
        ) : null}
      </Mapbox.MapView>
    </View>
  );
}
