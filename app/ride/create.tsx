import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Locate } from "lucide-react-native";

import { PlaceSearchInput } from "@/components/rides/PlaceSearchInput";
import { Button } from "@/components/ui/Button";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Stepper } from "@/components/ui/Stepper";
import { Typography } from "@/components/ui/Typography";
import { useCreateRide } from "@/features/rides/rides.hooks";
import { getCurrentLocation } from "@/features/location/location.service";
import { reverseGeocode } from "@/services/mapbox";
import { isMapboxConfigured } from "@/config/env";
import { buildCreateRideSchema } from "@/features/rides/rides.schema";
import { useThemeColors } from "@/theme";
import type { Place } from "@/types/models";

export default function CreateRideScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const createRide = useCreateRide();

  const [pickup, setPickup] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [departureTime, setDepartureTime] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000),
  );
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    // Seed pickup with the current location once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = () => {
    setSubmitError(null);
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

    createRide.mutate(parsed.data, {
      onSuccess: (ride) => router.replace(`/ride/${ride.id}`),
      onError: (err: any) =>
        setSubmitError(err.message ?? t("create.genericError")),
    });
  };

  return (
    <Screen edges={["top", "bottom"]}>
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
              error={errors.pickup}
            />
            {pickup ? (
              <View className="-mt-2 flex-row items-center">
                <Locate size={12} color={colors.accent} />
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
              error={errors.destination}
            />

            <DateTimeField
              label={t("create.departureTime")}
              value={departureTime}
              onChange={setDepartureTime}
              error={errors.departureTime}
            />

            {/* Seats */}
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

            <Input
              label={t("create.pricePerSeat")}
              placeholder={t("create.pricePlaceholder")}
              keyboardType="number-pad"
              value={price}
              onChangeText={setPrice}
              error={errors.price}
            />

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
              label={t("create.publish")}
              onPress={onSubmit}
              loading={createRide.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
