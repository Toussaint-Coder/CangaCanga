import { useEffect } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MapPin, Navigation } from "lucide-react-native";

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
  height?: number;
  rounded?: boolean;
}

/**
 * A reusable Mapbox map. If Mapbox is not configured yet (no token), it
 * renders a clean placeholder instead of crashing, so the app is fully
 * navigable while you wire up your token.
 */
export function RideMap({
  center,
  markers = [],
  pickup,
  destination,
  routeCoordinates,
  zoom = 12,
  showUserLocation = true,
  height = 220,
  rounded = true,
}: RideMapProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  useEffect(() => {
    initMapbox();
  }, []);

  const radius = rounded ? 20 : 0;

  if (!isMapboxAvailable || !isMapboxConfigured()) {
    return (
      <View
        style={{ height, borderRadius: radius }}
        className="items-center justify-center overflow-hidden border border-border bg-card"
      >
        <MapPin size={26} color={colors.mutedLight} />
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

  const centerCoord = center ?? pickup ?? { latitude: -3.3614, longitude: 29.3599 };

  return (
    <View style={{ height, borderRadius: radius }} className="overflow-hidden">
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={MAP_STYLE}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          zoomLevel={zoom}
          centerCoordinate={[centerCoord.longitude, centerCoord.latitude]}
          animationDuration={0}
        />

        {showUserLocation ? <Mapbox.UserLocation visible /> : null}

        {routeCoordinates && routeCoordinates.length > 1 ? (
          <Mapbox.ShapeSource
            id="route"
            shape={{
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: routeCoordinates },
            }}
          >
            <Mapbox.LineLayer
              id="route-line"
              style={{
                lineColor: colors.accent,
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </Mapbox.ShapeSource>
        ) : null}

        {pickup ? (
          <Mapbox.PointAnnotation
            id="pickup"
            coordinate={[pickup.longitude, pickup.latitude]}
          >
            <MarkerDot color={colors.accent} icon="pin" />
          </Mapbox.PointAnnotation>
        ) : null}

        {destination ? (
          <Mapbox.PointAnnotation
            id="destination"
            coordinate={[destination.longitude, destination.latitude]}
          >
            <MarkerDot color={colors.primary} icon="flag" />
          </Mapbox.PointAnnotation>
        ) : null}

        {markers.map((m) => (
          <Mapbox.PointAnnotation
            key={m.id}
            id={m.id}
            coordinate={[m.coordinate.longitude, m.coordinate.latitude]}
          >
            <MarkerDot color={colors.accent} icon="pin" />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
}

function MarkerDot({ color }: { color: string; icon?: string }) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: colors.secondary,
        borderColor: color,
        borderWidth: 3,
      }}
      className="h-7 w-7 items-center justify-center rounded-full"
    >
      <Navigation size={12} color={color} fill={color} />
    </View>
  );
}
