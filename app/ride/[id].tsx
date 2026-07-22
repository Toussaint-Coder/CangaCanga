import { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Icon, type IconName } from "@/components/ui/Icon";

import { RideMap } from "@/components/map/RideMap";
import { MAP_STYLE_SATELLITE } from "@/components/map/mapbox";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Typography } from "@/components/ui/Typography";
import { isMapboxConfigured } from "@/config/env";
import { getRoute } from "@/services/mapbox";
import { useRide } from "@/features/rides/rides.hooks";
import { useCancelRide } from "@/features/rides/rides.hooks";
import {
  useReserveSeat,
  useRideReservations,
  useRespondToReservation,
} from "@/features/reservations/reservations.hooks";
import { useCurrentUserId } from "@/stores/authStore";
import { fonts, useThemeColors } from "@/theme";
import {
  formatDeparture,
  formatDistance,
  formatDuration,
  formatPrice,
} from "@/utils/format";
import { formatPhoneDisplay, normalizePhone } from "@/utils/phone";
import type { ReservationWithRelations } from "@/types/models";

export default function RideDetailsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useCurrentUserId();
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const { data: ride, isLoading } = useRide(id);
  const reserve = useReserveSeat();
  const cancelRide = useCancelRide();

  const isDriver = !!ride && ride.driver_id === userId;
  const reservations = useRideReservations(isDriver ? id : undefined);

  const route = useQuery({
    queryKey: ["route", id],
    enabled: !!ride && isMapboxConfigured(),
    queryFn: () =>
      getRoute(
        { latitude: ride!.pickup_lat, longitude: ride!.pickup_lng },
        { latitude: ride!.destination_lat, longitude: ride!.destination_lng },
      ),
  });

  if (isLoading || !ride) {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader />
        <View className="flex-1 items-center justify-center">
          <Typography variant="caption">
            {isLoading ? t("ride.loading") : t("ride.notFound")}
          </Typography>
        </View>
      </Screen>
    );
  }

  const distance = route.data?.distanceMeters ?? ride.distance_m;
  const duration = route.data?.durationSeconds ?? ride.duration_s;
  const canReserve = !isDriver && ride.status === "open" && ride.available_seats > 0;

  const handleReserve = () => {
    reserve.mutate(
      { rideId: ride.id, seats: 1 },
      {
        onSuccess: () =>
          Alert.alert(
            t("ride.requestSentTitle"),
            t("ride.requestSentMessage"),
          ),
        onError: (err: any) =>
          Alert.alert(t("ride.couldNotReserve"), err.message),
      },
    );
  };

  const handleCancelRide = () => {
    Alert.alert(t("ride.cancelRideTitle"), t("ride.cancelRideMessage"), [
      { text: t("ride.keep"), style: "cancel" },
      {
        text: t("ride.cancelRide"),
        style: "destructive",
        onPress: () =>
          cancelRide.mutate(ride.id, {
            onSuccess: () => router.back(),
          }),
      },
    ]);
  };

  const driverPhone = ride.driver?.phone_number ?? null;

  const handleCallDriver = () => {
    if (!driverPhone) return;
    void Linking.openURL(`tel:${normalizePhone(driverPhone)}`);
  };

  const mapCenter = {
    latitude: (ride.pickup_lat + ride.destination_lat) / 2,
    longitude: (ride.pickup_lng + ride.destination_lng) / 2,
  };

  const mapProps = {
    center: mapCenter,
    pickup: { latitude: ride.pickup_lat, longitude: ride.pickup_lng },
    destination: {
      latitude: ride.destination_lat,
      longitude: ride.destination_lng,
    },
    routeCoordinates: route.data?.coordinates,
    showUserLocation: false as const,
    styleURL: MAP_STYLE_SATELLITE,
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("ride.title")} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Map — satellite + driving directions */}
        <View className="px-5">
          <View className="overflow-hidden rounded-[20px]">
            <RideMap {...mapProps} height={260} zoom={12} rounded={false} />
            <Pressable
              onPress={() => setMapFullscreen(true)}
              accessibilityRole="button"
              accessibilityLabel={t("ride.viewFullMap")}
              className="absolute bottom-3 right-3 flex-row items-center rounded-full bg-card/95 px-3 py-2"
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              <Icon name="open-in-full" size={16} color={colors.primary} />
              <Text
                style={{ fontFamily: fonts.medium }}
                className="ml-1.5 text-xs text-primary"
              >
                {t("ride.viewFullMap")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Route summary */}
        <View className="mt-4 px-5">
          <Card>
            <View className="flex-row items-center">
              <Icon name="place" size={16} color={colors.accent} />
              <Text
                style={{ fontFamily: fonts.medium }}
                className="ml-2 flex-1 text-sm text-primary"
              >
                {ride.pickup_label}
              </Text>
            </View>
            <View className="my-1.5 ml-2 h-5 w-px bg-border" />
            <View className="flex-row items-center">
              <Icon name="place" size={16} color={colors.primary} />
              <Text
                style={{ fontFamily: fonts.medium }}
                className="ml-2 flex-1 text-sm text-primary"
              >
                {ride.destination_label}
              </Text>
            </View>

            <View className="mt-4 flex-row justify-between border-t border-border pt-3">
              <Meta icon="straighten" label={formatDistance(distance)} />
              <Meta icon="schedule" label={formatDuration(duration)} />
              <Meta
                icon="group"
                label={t("ride.seats", { count: ride.available_seats })}
              />
              <Meta icon="payments" label={formatPrice(ride.price)} />
            </View>
          </Card>
        </View>

        {/* Departure */}
        <View className="mt-4 px-5">
          <Card className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Icon name="schedule" size={18} color={colors.muted} />
              <Text
                style={{ fontFamily: fonts.medium }}
                className="ml-2 text-sm text-primary"
              >
                {t("ride.departs", {
                  time: formatDeparture(ride.departure_time),
                })}
              </Text>
            </View>
            <Badge
              label={t(`rideStatus.${ride.status}`)}
              tone={ride.status === "open" ? "accent" : "neutral"}
            />
          </Card>
        </View>

        {/* Driver */}
        <View className="mt-4 px-5">
          <Typography variant="heading" className="mb-2">
            {t("ride.driver")}
          </Typography>
          <Card>
            <View className="flex-row items-center">
              <Avatar
                uri={ride.driver?.profile_picture}
                name={ride.driver?.full_name}
                size={52}
              />
              <View className="ml-3 flex-1">
                <Text
                  style={{ fontFamily: fonts.semibold }}
                  className="text-base text-primary"
                >
                  {ride.driver?.full_name}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <RatingStars rating={ride.driver?.rating ?? 0} size={13} />
                  {ride.driver?.vehicle_plate_number ? (
                    <Text
                      style={{ fontFamily: fonts.regular }}
                      className="ml-2 text-xs text-muted"
                    >
                      · {ride.driver.vehicle_plate_number}
                    </Text>
                  ) : null}
                </View>
                {driverPhone ? (
                  <View className="mt-1.5 flex-row items-center">
                    <Icon name="phone" size={14} color={colors.muted} />
                    <Text
                      style={{ fontFamily: fonts.medium }}
                      className="ml-1.5 text-sm text-primary"
                    >
                      {formatPhoneDisplay(driverPhone)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {driverPhone ? (
              <View className="mt-3">
                <Button
                  label={t("ride.callDriver")}
                  variant="secondary"
                  size="sm"
                  leftIcon={
                    <Icon name="phone" size={16} color={colors.secondary} />
                  }
                  onPress={handleCallDriver}
                />
              </View>
            ) : null}
          </Card>
        </View>

        {ride.vehicle_picture ? (
          <View className="mt-4 px-5">
            <Typography variant="heading" className="mb-2">
              {t("ride.vehicle")}
            </Typography>
            <View className="overflow-hidden rounded-2xl border border-border">
              <Image
                source={{ uri: ride.vehicle_picture }}
                style={{ width: "100%", height: 180 }}
                contentFit="cover"
              />
            </View>
          </View>
        ) : null}

        {/* Note */}
        {ride.note ? (
          <View className="mt-4 px-5">
            <Typography variant="heading" className="mb-2">
              {t("ride.note")}
            </Typography>
            <Card>
              <Text
                style={{ fontFamily: fonts.regular }}
                className="text-sm text-muted"
              >
                {ride.note}
              </Text>
            </Card>
          </View>
        ) : null}

        {/* Driver: reservation requests */}
        {isDriver ? (
          <View className="mt-6 px-5">
            <Typography variant="heading" className="mb-2">
              {t("ride.reservationRequests")}
            </Typography>
            {(reservations.data ?? []).length === 0 ? (
              <Card>
                <Typography variant="caption">{t("ride.noRequests")}</Typography>
              </Card>
            ) : (
              reservations.data!.map((res) => (
                <ReservationRequestRow
                  key={res.id}
                  reservation={res}
                  rideId={ride.id}
                />
              ))
            )}
          </View>
        ) : null}

        {/* Actions */}
        <View className="mt-8 px-5">
          {isDriver ? (
            ride.status === "open" || ride.status === "full" ? (
              <Button
                label={t("ride.cancelRide")}
                variant="danger"
                onPress={handleCancelRide}
                loading={cancelRide.isPending}
              />
            ) : null
          ) : canReserve ? (
            <Button
              label={t("ride.reserveSeat", { price: formatPrice(ride.price) })}
              onPress={handleReserve}
              loading={reserve.isPending}
            />
          ) : (
            <Button
              label={t("ride.notAvailable")}
              disabled
              variant="outline"
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={mapFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setMapFullscreen(false)}
      >
        <StatusBar barStyle="light-content" />
        <View className="flex-1 bg-black">
          <RideMap {...mapProps} fill zoom={11} rounded={false} />
          <View
            pointerEvents="box-none"
            className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-4"
            style={{ paddingTop: insets.top + 8 }}
          >
            <View className="max-w-[75%] rounded-2xl bg-card/95 px-3 py-2">
              <Text
                style={{ fontFamily: fonts.semibold }}
                className="text-sm text-primary"
                numberOfLines={1}
              >
                {ride.pickup_label}
              </Text>
              <Text
                style={{ fontFamily: fonts.regular }}
                className="mt-0.5 text-xs text-muted"
                numberOfLines={1}
              >
                → {ride.destination_label}
              </Text>
            </View>
            <Pressable
              onPress={() => setMapFullscreen(false)}
              accessibilityRole="button"
              accessibilityLabel={t("ride.closeMap")}
              className="h-11 w-11 items-center justify-center rounded-full bg-card"
            >
              <Icon name="close" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Meta({ icon, label }: { icon: IconName; label: string }) {
  const colors = useThemeColors();
  return (
    <View className="items-center">
      <Icon name={icon} size={16} color={colors.muted} />
      <Text
        style={{ fontFamily: fonts.medium }}
        className="mt-1 text-xs text-primary"
      >
        {label}
      </Text>
    </View>
  );
}

function ReservationRequestRow({
  reservation,
  rideId,
}: {
  reservation: ReservationWithRelations;
  rideId: string;
}) {
  const { t } = useTranslation();
  const respond = useRespondToReservation(rideId);
  const pending = reservation.status === "pending";

  return (
    <Card className="mb-2">
      <View className="flex-row items-center">
        <Avatar
          uri={reservation.passenger?.profile_picture}
          name={reservation.passenger?.full_name}
          size={40}
        />
        <View className="ml-3 flex-1">
          <Text
            style={{ fontFamily: fonts.semibold }}
            className="text-sm text-primary"
          >
            {reservation.passenger?.full_name}
          </Text>
          <Text
            style={{ fontFamily: fonts.regular }}
            className="text-xs text-muted"
          >
            {t("ride.seatCount", { count: reservation.seats })}
          </Text>
        </View>
        {!pending ? (
          <Badge
            label={t(`reservationStatus.${reservation.status}`)}
            tone={
              reservation.status === "accepted"
                ? "success"
                : reservation.status === "rejected"
                  ? "danger"
                  : "neutral"
            }
          />
        ) : null}
      </View>

      {pending ? (
        <View className="mt-3 flex-row gap-x-3">
          <View className="flex-1">
            <Button
              label={t("ride.decline")}
              variant="outline"
              size="sm"
              onPress={() =>
                respond.mutate({ id: reservation.id, accept: false })
              }
            />
          </View>
          <View className="flex-1">
            <Button
              label={t("ride.accept")}
              variant="secondary"
              size="sm"
              onPress={() =>
                respond.mutate({ id: reservation.id, accept: true })
              }
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
