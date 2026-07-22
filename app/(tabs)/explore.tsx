import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { RideMap, type RideMarker } from "@/components/map/RideMap";
import {
  mapStyleUrl,
  type MapStyleKind,
} from "@/components/map/mapbox";
import { RideCard } from "@/components/rides/RideCard";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { useCurrentLocation } from "@/features/location/location.hooks";
import { useRides } from "@/features/rides/rides.hooks";
import { fonts, shadow, useThemeColors } from "@/theme";
import { cn } from "@/utils/cn";

const SEAT_OPTIONS = [1, 2, 3, 4];

export default function ExploreScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [destination, setDestination] = useState("");
  const [seats, setSeats] = useState<number | undefined>(undefined);
  const [mapStyle, setMapStyle] = useState<MapStyleKind>("satellite");
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const { data: location } = useCurrentLocation();

  const filters = useMemo(
    () => ({ destination: destination.trim() || undefined, seats }),
    [destination, seats],
  );

  const { data, isLoading } = useRides(filters);

  // Drop selection if the ride is no longer in the filtered set.
  useEffect(() => {
    if (!selectedRideId) return;
    if (!(data ?? []).some((r) => r.id === selectedRideId)) {
      setSelectedRideId(null);
    }
  }, [data, selectedRideId]);

  const markers: RideMarker[] = useMemo(
    () =>
      (data ?? []).map((r) => ({
        id: r.id,
        coordinate: { latitude: r.pickup_lat, longitude: r.pickup_lng },
        label: r.destination_label ?? r.pickup_label,
      })),
    [data],
  );

  const selectedRide = useMemo(
    () => (data ?? []).find((r) => r.id === selectedRideId) ?? null,
    [data, selectedRideId],
  );

  const isSatellite = mapStyle === "satellite";

  return (
    <View className="flex-1 bg-background">
      <RideMap
        center={location ?? undefined}
        markers={markers}
        selectedMarkerId={selectedRideId ?? undefined}
        showUserLocation
        fill
        rounded={false}
        zoom={12}
        styleURL={mapStyleUrl(mapStyle)}
        onMarkerPress={(id) =>
          setSelectedRideId((prev) => (prev === id ? null : id))
        }
      />

      {/* Search + seat filters */}
      <View
        pointerEvents="box-none"
        style={{ paddingTop: insets.top + 8 }}
        className="absolute left-0 right-0 top-0 px-4"
      >
        <View
          style={[shadow.card, { backgroundColor: colors.card }]}
          className="rounded-2xl px-1 pb-3 pt-1"
        >
          <Input
            placeholder={t("explore.destinationPlaceholder")}
            value={destination}
            onChangeText={(text) => {
              setDestination(text);
              setSelectedRideId(null);
            }}
            leftIcon={<Icon name="search" size={18} color={colors.muted} />}
          />
          <View className="mt-2 flex-row items-center px-3">
            <Text
              style={{ fontFamily: fonts.medium }}
              className="mr-2 text-xs text-muted"
            >
              {t("explore.seats")}
            </Text>
            {SEAT_OPTIONS.map((n) => {
              const active = seats === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => {
                    setSeats(active ? undefined : n);
                    setSelectedRideId(null);
                  }}
                  className={cn(
                    "mr-2 h-8 w-9 items-center justify-center rounded-full border",
                    active
                      ? "border-accent bg-accent"
                      : "border-border bg-card",
                  )}
                >
                  <Text
                    style={{ fontFamily: fonts.medium }}
                    className={cn(
                      "text-sm",
                      active ? "text-secondary" : "text-primary",
                    )}
                  >
                    {n}
                    {n === 4 ? "+" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!isLoading && (data?.length ?? 0) === 0 ? (
          <View
            style={[shadow.card, { backgroundColor: colors.card }]}
            className="mt-2 rounded-2xl px-4 py-3"
          >
            <Typography variant="caption">{t("explore.emptyTitle")}</Typography>
          </View>
        ) : null}
      </View>

      {/* Satellite ↔ street toggle */}
      <View
        pointerEvents="box-none"
        className="absolute right-4"
        style={{ top: insets.top + 118 }}
      >
        <Pressable
          onPress={() =>
            setMapStyle((prev) =>
              prev === "satellite" ? "street" : "satellite",
            )
          }
          accessibilityRole="button"
          accessibilityLabel={
            isSatellite ? t("explore.streets") : t("explore.satellite")
          }
          style={[shadow.floating, { backgroundColor: colors.card }]}
          className="h-11 flex-row items-center rounded-full border border-border px-3.5"
        >
          <Icon
            name={isSatellite ? "map" : "layers"}
            size={18}
            color={colors.primary}
          />
          <Text
            style={{ fontFamily: fonts.medium }}
            className="ml-2 text-sm text-primary"
          >
            {isSatellite ? t("explore.streets") : t("explore.satellite")}
          </Text>
        </Pressable>
      </View>

      {/* Selected ride card — only when a map point is tapped */}
      {selectedRide ? (
        <View
          pointerEvents="box-none"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 72 }}
          className="absolute bottom-0 left-0 right-0 px-4"
        >
          <View style={shadow.floating}>
            <RideCard
              ride={selectedRide}
              onPress={() => router.push(`/ride/${selectedRide.id}`)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
