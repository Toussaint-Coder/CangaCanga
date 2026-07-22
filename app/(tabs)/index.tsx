import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { RideMap, type RideMarker } from "@/components/map/RideMap";
import { MAP_STYLE_SATELLITE } from "@/components/map/mapbox";
import { RideCard } from "@/components/rides/RideCard";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useCurrentLocation } from "@/features/location/location.hooks";
import { useNearbyRides } from "@/features/rides/rides.hooks";
import { useMyReservations } from "@/features/reservations/reservations.hooks";
import { useAuthStore } from "@/stores/authStore";
import { fonts, useThemeColors } from "@/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: location } = useCurrentLocation();
  const nearby = useNearbyRides(location ?? undefined);
  const reservations = useMyReservations();

  const firstName = profile?.full_name?.split(" ")[0] ?? t("home.fallbackName");

  const markers: RideMarker[] = useMemo(
    () =>
      (nearby.data ?? []).map((r) => ({
        id: r.id,
        coordinate: { latitude: r.pickup_lat, longitude: r.pickup_lng },
        label: r.destination_label ?? r.pickup_label,
      })),
    [nearby.data],
  );

  const upcoming = (reservations.data ?? []).filter(
    (r) => r.status === "accepted" || r.status === "pending",
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={nearby.isRefetching}
            onRefresh={() => nearby.refetch()}
            tintColor={colors.muted}
          />
        }
      >
        <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
          <View>
            <Typography variant="caption">{t("home.greeting")}</Typography>
            <Typography variant="heading">{firstName} 👋</Typography>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            <Avatar
              uri={profile?.profile_picture}
              name={profile?.full_name}
              size={44}
            />
          </Pressable>
        </View>

        <View className="px-5">
          <Pressable
            onPress={() => router.push("/(tabs)/explore")}
            className="flex-row items-center rounded-2xl border border-border bg-card px-4"
            style={{ height: 52 }}
          >
            <Icon name="search" size={18} color={colors.muted} />
            <Text
              style={{ fontFamily: fonts.regular }}
              className="ml-3 text-base text-mutedLight"
            >
              {t("home.searchPlaceholder")}
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 px-5">
          <RideMap
            center={location ?? undefined}
            markers={markers}
            showUserLocation
            height={220}
            zoom={13}
            styleURL={MAP_STYLE_SATELLITE}
          />
        </View>

        <View className="mt-4 px-5">
          <Pressable
            onPress={() => router.push("/ride/create")}
            className="flex-row items-center justify-between rounded-2xl bg-primary p-4"
          >
            <View className="flex-1 pr-3">
              <Text
                style={{ fontFamily: fonts.semibold }}
                className="text-base text-secondary"
              >
                {t("home.ctaTitle")}
              </Text>
              <Text
                style={{ fontFamily: fonts.regular }}
                className="mt-0.5 text-sm text-secondary/70"
              >
                {t("home.ctaSubtitle")}
              </Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Icon name="directions-car" size={20} color={colors.secondary} />
            </View>
          </Pressable>
        </View>

        {upcoming.length > 0 ? (
          <View className="mt-6">
            <View className="mb-3 flex-row items-center justify-between px-5">
              <Typography variant="heading">{t("home.upcoming")}</Typography>
              <Pressable onPress={() => router.push("/(tabs)/trips")}>
                <Text className="text-sm font-medium text-accent">
                  {t("home.seeAll")}
                </Text>
              </Pressable>
            </View>
            <View className="px-5">
              {upcoming.slice(0, 2).map((res) => (
                <RideCard
                  key={res.id}
                  ride={res.ride}
                  onPress={() => router.push(`/ride/${res.ride_id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between px-5">
            <Typography variant="heading">{t("home.nearby")}</Typography>
            <Pressable onPress={() => router.push("/(tabs)/explore")}>
              <Text className="text-sm font-medium text-accent">
                {t("home.explore")}
              </Text>
            </Pressable>
          </View>

          <View className="px-5">
            {nearby.isLoading ? (
              <Typography variant="caption">{t("home.finding")}</Typography>
            ) : (nearby.data ?? []).length === 0 ? (
              <View className="rounded-2xl border border-border bg-card p-5">
                <Typography variant="body">{t("home.noNearbyTitle")}</Typography>
                <Typography variant="caption" className="mt-1">
                  {t("home.noNearbyDesc")}
                </Typography>
              </View>
            ) : (
              nearby.data!.slice(0, 5).map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onPress={() => router.push(`/ride/${ride.id}`)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
