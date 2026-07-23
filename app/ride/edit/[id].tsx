import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { MapPlacePicker } from "@/components/rides/MapPlacePicker";
import { PlaceSearchInput } from "@/components/rides/PlaceSearchInput";
import { Button } from "@/components/ui/Button";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Typography } from "@/components/ui/Typography";
import {
  MAX_SEATS,
  rememberRoute,
  resolveVehiclePictureUrl,
} from "@/features/rides/rideDrafts";
import { useRide, useUpdateRide } from "@/features/rides/rides.hooks";
import { buildUpdateRideSchema } from "@/features/rides/rides.schema";
import { useAuthStore } from "@/stores/authStore";
import { fonts, useThemeColors } from "@/theme";
import type { Place } from "@/types/models";
import { pickImage } from "@/utils/pickImage";

type MapPickTarget = "pickup" | "destination" | null;

export default function EditRideScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { data: ride, isLoading } = useRide(id);
  const updateRide = useUpdateRide();

  const [pickup, setPickup] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [departureTime, setDepartureTime] = useState(new Date());
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [vehicleUri, setVehicleUri] = useState<string | null>(null);
  const [vehicleMime, setVehicleMime] = useState<string | null>(null);
  const [mapPick, setMapPick] = useState<MapPickTarget>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const reservedSeats = useMemo(
    () => (ride ? ride.seats_total - ride.available_seats : 0),
    [ride],
  );

  const isLift = price === "0";
  const canEdit =
    !!ride &&
    ride.driver_id === userId &&
    (ride.status === "open" || ride.status === "full");

  useEffect(() => {
    if (!ride || hydrated) return;
    setPickup({
      label: ride.pickup_label,
      latitude: ride.pickup_lat,
      longitude: ride.pickup_lng,
    });
    setDestination({
      label: ride.destination_label,
      latitude: ride.destination_lat,
      longitude: ride.destination_lng,
    });
    setDepartureTime(new Date(ride.departure_time));
    setSeats(ride.seats_total);
    setPrice(String(ride.price));
    setNote(ride.note ?? "");
    setVehicleUri(ride.vehicle_picture);
    setHydrated(true);
  }, [ride, hydrated]);

  const pickVehiclePhoto = async (source: "camera" | "library") => {
    try {
      const picked = await pickImage(source);
      if (!picked) return;
      setVehicleUri(picked.uri);
      setVehicleMime(picked.mimeType);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.vehiclePicture;
        return next;
      });
    } catch (err: any) {
      setSubmitError(err?.message ?? t("media.pickFailed"));
    }
  };

  const onSubmit = async () => {
    if (!ride || !canEdit) return;
    setSubmitError(null);

    if (!vehicleUri) {
      setErrors({ vehiclePicture: t("create.vehiclePictureRequired") });
      return;
    }

    const input = {
      pickup: pickup ?? undefined,
      destination: destination ?? undefined,
      departureTime: departureTime.toISOString(),
      availableSeats: seats,
      price: Number(price || 0),
      note: note.trim() || undefined,
    };

    const parsed = buildUpdateRideSchema(reservedSeats).safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!userId) {
      setSubmitError(t("editRide.genericError"));
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const vehiclePictureUrl = await resolveVehiclePictureUrl(
        vehicleUri,
        userId,
        vehicleMime,
        setUploadProgress,
      );
      updateRide.mutate(
        {
          rideId: ride.id,
          input: { ...parsed.data, vehiclePictureUrl },
        },
        {
          onSuccess: async () => {
            await rememberRoute({
              pickup: parsed.data.pickup,
              destination: parsed.data.destination,
              seats: parsed.data.availableSeats,
              price: parsed.data.price,
              note: parsed.data.note,
            });
            router.replace(`/ride/${ride.id}`);
          },
          onError: (err: any) =>
            setSubmitError(err.message ?? t("editRide.genericError")),
          onSettled: () => setUploadProgress(null),
        },
      );
    } catch (err: any) {
      setSubmitError(err?.message ?? t("editRide.genericError"));
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !ride) {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader title={t("editRide.title")} variant="close" />
        <View className="flex-1 items-center justify-center">
          <Typography variant="caption">
            {isLoading ? t("ride.loading") : t("ride.notFound")}
          </Typography>
        </View>
      </Screen>
    );
  }

  if (!canEdit) {
    return (
      <Screen edges={["top", "bottom"]}>
        <ScreenHeader title={t("editRide.title")} variant="close" />
        <View className="flex-1 items-center justify-center px-8">
          <Typography variant="caption" className="text-center">
            {t("editRide.notEditable")}
          </Typography>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "bottom"]} className="relative">
      <ScreenHeader title={t("editRide.title")} variant="close" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {reservedSeats > 0 ? (
            <Typography variant="caption" className="mb-4">
              {t("editRide.reservedHint", { count: reservedSeats })}
            </Typography>
          ) : (
            <Typography variant="caption" className="mb-4">
              {t("editRide.intro")}
            </Typography>
          )}

          <View className="gap-y-4">
            <View>
              <Text
                style={{ fontFamily: fonts.medium }}
                className="mb-2 text-sm text-primary"
              >
                {t("create.vehiclePicture")}
              </Text>
              <View className="overflow-hidden rounded-2xl border border-border bg-card">
                {vehicleUri ? (
                  <Image
                    source={{ uri: vehicleUri }}
                    style={{ width: "100%", height: 160 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-36 items-center justify-center px-4">
                    <Icon name="photo-camera" size={28} color={colors.muted} />
                  </View>
                )}
              </View>
              <View className="mt-2 flex-row gap-x-2">
                <Pressable
                  onPress={() => void pickVehiclePhoto("camera")}
                  disabled={uploading}
                  className="flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-card px-3 py-3"
                >
                  <Icon name="photo-camera" size={18} color={colors.accent} />
                  <Text
                    style={{ fontFamily: fonts.medium }}
                    className="ml-2 text-sm text-accent"
                  >
                    {t("media.takePhoto")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void pickVehiclePhoto("library")}
                  disabled={uploading}
                  className="flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-card px-3 py-3"
                >
                  <Icon name="image" size={18} color={colors.accent} />
                  <Text
                    style={{ fontFamily: fonts.medium }}
                    className="ml-2 text-sm text-accent"
                  >
                    {t("media.chooseFromLibrary")}
                  </Text>
                </Pressable>
              </View>
            </View>

            <PlaceSearchInput
              label={t("create.pickup")}
              placeholder={t("create.pickupPlaceholder")}
              value={pickup}
              proximity={
                pickup
                  ? { latitude: pickup.latitude, longitude: pickup.longitude }
                  : undefined
              }
              onSelect={setPickup}
              onPickOnMap={() => setMapPick("pickup")}
              error={errors.pickup}
            />

            <PlaceSearchInput
              label={t("create.destination")}
              placeholder={t("create.destinationPlaceholder")}
              value={destination}
              proximity={
                pickup
                  ? { latitude: pickup.latitude, longitude: pickup.longitude }
                  : undefined
              }
              onSelect={setDestination}
              onPickOnMap={() => setMapPick("destination")}
              error={errors.destination}
            />

            <View className="flex-row gap-x-2">
              <DateTimeField
                className="flex-1"
                label={t("create.departureDate")}
                value={departureTime}
                onChange={setDepartureTime}
                mode="date"
                error={errors.departureTime}
              />
              <DateTimeField
                className="flex-1"
                label={t("create.departureTime")}
                value={departureTime}
                onChange={setDepartureTime}
                mode="time"
              />
            </View>

            <View className="rounded-2xl border border-border bg-card px-4 py-3">
              <Text className="text-sm font-medium text-primary">
                {t("create.availableSeats")}
              </Text>
              <Text className="mb-2 text-xs text-muted">
                {t("create.howManyJoin")}
              </Text>
              <Input
                keyboardType="number-pad"
                value={String(seats)}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, "");
                  if (!digits) {
                    setSeats(Math.max(1, reservedSeats));
                    return;
                  }
                  const next = Math.min(MAX_SEATS, Math.max(1, Number(digits)));
                  setSeats(next);
                }}
                error={errors.availableSeats}
              />
            </View>

            <View>
              <Text
                style={{ fontFamily: fonts.medium }}
                className="mb-2 text-sm text-primary"
              >
                {t("create.pricePerSeat")}
              </Text>
              <View className="flex-row items-center gap-x-2">
                <View className="flex-1">
                  <Input
                    placeholder={
                      isLift
                        ? t("create.liftFree")
                        : t("create.pricePlaceholder")
                    }
                    keyboardType="number-pad"
                    value={isLift ? "" : price}
                    editable={!isLift}
                    onChangeText={setPrice}
                    error={errors.price}
                  />
                </View>
                <Pressable
                  onPress={() => setPrice(isLift ? "" : "0")}
                  className={
                    isLift
                      ? "h-[52px] items-center justify-center rounded-2xl bg-accent px-4"
                      : "h-[52px] items-center justify-center rounded-2xl border border-border bg-card px-4"
                  }
                >
                  <Text
                    style={{ fontFamily: fonts.semibold }}
                    className={
                      isLift ? "text-sm text-secondary" : "text-sm text-primary"
                    }
                  >
                    {t("create.lift")}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Input
              label={t("create.note")}
              placeholder={t("create.notePlaceholder")}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: "top" }}
              error={errors.note}
            />

            {submitError ? (
              <Text className="text-sm text-danger">{submitError}</Text>
            ) : null}

            <Button
              label={
                uploadProgress != null
                  ? `${t("common.uploading")} ${Math.round(uploadProgress * 100)}%`
                  : t("editRide.save")
              }
              onPress={() => void onSubmit()}
              loading={updateRide.isPending || (uploading && uploadProgress == null)}
              disabled={uploading || updateRide.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MapPlacePicker
        visible={mapPick === "pickup"}
        title={t("create.pickPickupOnMap")}
        initial={
          pickup
            ? { latitude: pickup.latitude, longitude: pickup.longitude }
            : null
        }
        onConfirm={setPickup}
        onClose={() => setMapPick(null)}
      />
      <MapPlacePicker
        visible={mapPick === "destination"}
        title={t("create.pickDestinationOnMap")}
        initial={
          destination
            ? {
                latitude: destination.latitude,
                longitude: destination.longitude,
              }
            : pickup
              ? { latitude: pickup.latitude, longitude: pickup.longitude }
              : null
        }
        onConfirm={setDestination}
        onClose={() => setMapPick(null)}
      />
    </Screen>
  );
}
