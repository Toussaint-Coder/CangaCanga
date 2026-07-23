import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { RideMap } from "@/components/map/RideMap";
import { MAP_STYLE_SATELLITE } from "@/components/map/mapbox";
import { Icon } from "@/components/ui/Icon";
import { isMapboxConfigured } from "@/config/env";
import { requestLocationPermission } from "@/features/location/location.service";
import { getRoute } from "@/services/mapbox";
import { fonts, useThemeColors } from "@/theme";
import type { Coordinates } from "@/types/models";
import { formatDistance, formatDuration } from "@/utils/format";

type Props = {
  visible: boolean;
  pickup: Coordinates;
  pickupLabel: string;
  onClose: () => void;
};

/**
 * Fullscreen in-app navigation: live Mapbox route from the passenger to pickup.
 * Updates as the user moves — no external maps apps.
 */
export function NavigateToPickupModal({
  visible,
  pickup,
  pickupLabel,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [userPos, setUserPos] = useState<Coordinates | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    [number, number][] | undefined
  >();
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRouteAt = useRef(0);
  const lastRoutePos = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!visible) {
      setUserPos(null);
      setRouteCoordinates(undefined);
      setDistanceMeters(null);
      setDurationSeconds(null);
      setLoading(true);
      lastRouteAt.current = 0;
      lastRoutePos.current = null;
      return;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    const refreshRoute = async (from: Coordinates) => {
      if (!isMapboxConfigured()) return;
      const now = Date.now();
      const prev = lastRoutePos.current;
      const movedFar =
        !prev ||
        haversineMeters(prev, from) >= 25 ||
        now - lastRouteAt.current >= 12_000;
      if (!movedFar) return;

      try {
        const route = await getRoute(from, pickup);
        if (cancelled || !route) return;
        setRouteCoordinates(route.coordinates);
        setDistanceMeters(route.distanceMeters);
        setDurationSeconds(route.durationSeconds);
        lastRouteAt.current = now;
        lastRoutePos.current = from;
      } catch {
        // Keep the last successful polyline if Mapbox fails briefly.
      }
    };

    (async () => {
      const granted = await requestLocationPermission();
      if (cancelled) return;
      if (!granted) {
        setLoading(false);
        Alert.alert(
          t("ride.locationNeededTitle"),
          t("ride.locationNeededMessage"),
        );
        return;
      }

      try {
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (cancelled) return;
        const coords: Coordinates = {
          latitude: first.coords.latitude,
          longitude: first.coords.longitude,
        };
        setUserPos(coords);
        await refreshRoute(coords);
      } finally {
        if (!cancelled) setLoading(false);
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 15,
          timeInterval: 3000,
        },
        (pos) => {
          if (cancelled) return;
          const next: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserPos(next);
          void refreshRoute(next);
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [visible, pickup, t]);

  const arrived =
    userPos != null && haversineMeters(userPos, pickup) < 40;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 bg-black">
        <RideMap
          center={userPos ?? pickup}
          pickup={pickup}
          routeCoordinates={routeCoordinates}
          showUserLocation={!!userPos}
          followCenter={!!userPos}
          fill
          zoom={15}
          rounded={false}
          styleURL={MAP_STYLE_SATELLITE}
        />

        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0 top-0 px-4"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-start justify-between">
            <View className="max-w-[75%] rounded-2xl bg-card/95 px-3 py-2">
              <Text
                style={{ fontFamily: fonts.semibold }}
                className="text-sm text-primary"
              >
                {t("ride.takeMeToRide")}
              </Text>
              <Text
                style={{ fontFamily: fonts.regular }}
                className="mt-0.5 text-xs text-muted"
                numberOfLines={2}
              >
                {loading
                  ? t("ride.findingYou")
                  : arrived
                    ? t("ride.youArrived")
                    : t("ride.navigatingToPickup", { place: pickupLabel })}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("ride.closeMap")}
              className="h-11 w-11 items-center justify-center rounded-full bg-card"
            >
              <Icon name="close" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View
          className="absolute left-0 right-0 px-5"
          style={{ bottom: insets.bottom + 16 }}
        >
          <View className="rounded-2xl bg-card/95 px-4 py-3">
            <View className="flex-row items-center">
              <Icon name="navigation" size={18} color={colors.accent} />
              <Text
                style={{ fontFamily: fonts.semibold }}
                className="ml-2 flex-1 text-sm text-primary"
                numberOfLines={1}
              >
                {pickupLabel}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text
                style={{ fontFamily: fonts.medium }}
                className="text-xs text-muted"
              >
                {arrived
                  ? t("ride.youArrived")
                  : distanceMeters != null
                    ? t("ride.remainingDistance", {
                        distance: formatDistance(distanceMeters),
                      })
                    : t("ride.calculatingRoute")}
              </Text>
              {!arrived && durationSeconds != null ? (
                <Text
                  style={{ fontFamily: fonts.semibold }}
                  className="text-sm text-primary"
                >
                  {formatDuration(durationSeconds)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
