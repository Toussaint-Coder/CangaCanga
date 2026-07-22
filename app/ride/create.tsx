import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { MapPlacePicker } from "@/components/rides/MapPlacePicker";
import { PlaceSearchInput } from "@/components/rides/PlaceSearchInput";
import { Button } from "@/components/ui/Button";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Stepper } from "@/components/ui/Stepper";
import { Typography } from "@/components/ui/Typography";
import { isMapboxConfigured } from "@/config/env";
import { getCurrentLocation } from "@/features/location/location.service";
import { useCreateRide } from "@/features/rides/rides.hooks";
import { buildCreateRideSchema } from "@/features/rides/rides.schema";
import { reverseGeocode } from "@/services/mapbox";
import { uploadVehiclePicture } from "@/services/r2";
import { useAuthStore } from "@/stores/authStore";
import { fonts, useThemeColors } from "@/theme";
import type { Place } from "@/types/models";
import { pickImage } from "@/utils/pickImage";

type MapPickTarget = "pickup" | "destination" | null;

export default function CreateRideScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const createRide = useCreateRide();
  const userId = useAuthStore((s) => s.session?.user?.id);

  const [pickup, setPickup] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [departureTime, setDepartureTime] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000),
  );
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

  const isLift = price === "0";

  // Default pickup = current location.
  useEffect(() => {
    (async () => {
      const coords = await getCurrentLocation();
      let label = t("create.currentLocation");
      if (isMapboxConfigured()) {
        const reversed = await reverseGeocode(coords);
        if (reversed) label = reversed;
      }
      setPickup({
        label,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const parsed = buildCreateRideSchema().safeParse(input);
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
      setSubmitError(t("create.genericError"));
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const vehiclePictureUrl = await uploadVehiclePicture(
        vehicleUri,
        userId,
        vehicleMime,
        setUploadProgress,
      );
      createRide.mutate(
        { ...parsed.data, vehiclePictureUrl },
        {
          onSuccess: (ride) => router.replace(`/ride/${ride.id}`),
          onError: (err: any) =>
            setSubmitError(err.message ?? t("create.genericError")),
          onSettled: () => setUploadProgress(null),
        },
      );
    } catch (err: any) {
      setSubmitError(err?.message ?? t("create.genericError"));
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]} className="relative">
      <ScreenHeader title={t("create.title")} variant="close" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Typography variant="caption" className="mb-4">
            {t("create.intro")}
          </Typography>

          <View className="gap-y-4">
            {/* Vehicle picture */}
            <View>
              <Text
                style={{ fontFamily: fonts.medium }}
                className="mb-2 text-sm text-primary"
              >
                {t("create.vehiclePicture")}
              </Text>
              <View className="overflow-hidden rounded-2xl border border-border bg-card">
                {vehicleUri ? (
                  <View>
                    <Image
                      source={{ uri: vehicleUri }}
                      style={{ width: "100%", height: 160 }}
                      contentFit="cover"
                    />
                    {uploadProgress != null ? (
                      <View className="absolute inset-0 items-center justify-center bg-black/55">
                        <Text
                          style={{ fontFamily: fonts.bold }}
                          className="text-3xl text-white"
                        >
                          {Math.round(uploadProgress * 100)}%
                        </Text>
                        <View className="mt-3 h-2.5 w-48 overflow-hidden rounded-full bg-white/30">
                          <View
                            className="h-full rounded-full bg-white"
                            style={{
                              width: `${Math.round(uploadProgress * 100)}%`,
                            }}
                          />
                        </View>
                        <Text
                          style={{ fontFamily: fonts.medium }}
                          className="mt-2 text-sm text-white"
                        >
                          {t("common.uploading")}{" "}
                          {Math.round(uploadProgress * 100)}%
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View className="h-36 items-center justify-center px-4">
                    <Icon name="photo-camera" size={28} color={colors.muted} />
                    <Text
                      style={{ fontFamily: fonts.regular }}
                      className="mt-2 text-center text-xs text-muted"
                    >
                      {t("create.vehiclePictureHint")}
                    </Text>
                  </View>
                )}
              </View>

              <View className="mt-2 flex-row gap-x-2">
                <Pressable
                  onPress={() => void pickVehiclePhoto("camera")}
                  disabled={uploading}
                  className="flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-card px-3 py-3"
                  style={{ opacity: uploading ? 0.5 : 1 }}
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
                  style={{ opacity: uploading ? 0.5 : 1 }}
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

              {errors.vehiclePicture ? (
                <Text
                  style={{ fontFamily: fonts.regular }}
                  className="mt-1.5 text-xs text-danger"
                >
                  {errors.vehiclePicture}
                </Text>
              ) : null}
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
            {pickup ? (
              <View className="-mt-2 flex-row items-center">
                <Icon name="my-location" size={12} color={colors.accent} />
                <Text className="ml-1.5 text-xs text-muted">
                  {t("create.defaultsToLocation")}
                </Text>
              </View>
            ) : null}

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

            <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <View>
                <Text className="text-sm font-medium text-primary">
                  {t("create.availableSeats")}
                </Text>
                <Text className="text-xs text-muted">
                  {t("create.howManyJoin")}
                </Text>
              </View>
              <Stepper value={seats} min={1} max={8} onChange={setSeats} />
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
              {isLift ? (
                <Text
                  style={{ fontFamily: fonts.regular }}
                  className="mt-1.5 text-xs text-muted"
                >
                  {t("create.liftHint")}
                </Text>
              ) : null}
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
                  : t("create.publish")
              }
              onPress={() => void onSubmit()}
              loading={createRide.isPending || (uploading && uploadProgress == null)}
              disabled={uploading || createRide.isPending}
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
