import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Car, Ticket } from "lucide-react-native";

import { RideCard } from "@/components/rides/RideCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useMyRides } from "@/features/rides/rides.hooks";
import { useMyReservations } from "@/features/reservations/reservations.hooks";
import { fonts, useThemeColors } from "@/theme";
import { cn } from "@/utils/cn";
import type { ReservationStatus, RideStatus } from "@/types/database";

type Role = "driver" | "passenger";

const rideStatusTone: Record<
  RideStatus,
  "neutral" | "accent" | "success" | "danger" | "warning"
> = {
  open: "accent",
  full: "warning",
  in_progress: "accent",
  completed: "success",
  cancelled: "danger",
};

const reservationStatusTone: Record<
  ReservationStatus,
  "neutral" | "accent" | "success" | "danger" | "warning"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export default function TripsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const [role, setRole] = useState<Role>("passenger");

  const myRides = useMyRides();
  const myReservations = useMyReservations();

  return (
    <Screen>
      <View className="px-5 pb-3 pt-2">
        <Typography variant="title">{t("trips.title")}</Typography>

        {/* Segmented control */}
        <View className="mt-4 flex-row rounded-2xl border border-border bg-card p-1">
          {(["passenger", "driver"] as Role[]).map((r) => {
            const active = role === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                className={cn(
                  "flex-1 flex-row items-center justify-center rounded-xl py-2.5",
                  active && "bg-primary",
                )}
              >
                {r === "passenger" ? (
                  <Ticket
                    size={15}
                    color={active ? colors.secondary : colors.muted}
                  />
                ) : (
                  <Car
                    size={15}
                    color={active ? colors.secondary : colors.muted}
                  />
                )}
                <Text
                  style={{ fontFamily: fonts.medium }}
                  className={cn(
                    "ml-2 text-sm",
                    active ? "text-secondary" : "text-muted",
                  )}
                >
                  {r === "passenger"
                    ? t("trips.asPassenger")
                    : t("trips.asDriver")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {role === "passenger" ? (
          (myReservations.data ?? []).length === 0 ? (
            <EmptyState
              icon={Ticket}
              title={t("trips.noReservationsTitle")}
              description={t("trips.noReservationsDesc")}
            />
          ) : (
            myReservations.data!.map((res) => (
              <View key={res.id} className="mb-1">
                <View className="mb-1 flex-row items-center justify-between">
                  <Badge
                    label={t(`reservationStatus.${res.status}`)}
                    tone={reservationStatusTone[res.status]}
                  />
                </View>
                <RideCard
                  ride={res.ride}
                  onPress={() => router.push(`/ride/${res.ride_id}`)}
                />
              </View>
            ))
          )
        ) : (myRides.data ?? []).length === 0 ? (
          <EmptyState
            icon={Car}
            title={t("trips.noRidesTitle")}
            description={t("trips.noRidesDesc")}
          />
        ) : (
          myRides.data!.map((ride) => (
            <View key={ride.id} className="mb-1">
              <View className="mb-1 flex-row items-center justify-between">
                <Badge
                  label={t(`rideStatus.${ride.status}`)}
                  tone={rideStatusTone[ride.status]}
                />
              </View>
              <RideCard
                ride={ride}
                onPress={() => router.push(`/ride/${ride.id}`)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
