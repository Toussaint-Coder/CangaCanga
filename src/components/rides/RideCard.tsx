import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, MapPin, Users } from "lucide-react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { fonts, useThemeColors } from "@/theme";
import {
  formatDeparture,
  formatDistance,
  formatPrice,
} from "@/utils/format";
import type { NearbyRide, RideWithDriver } from "@/types/models";

type AnyRide = (RideWithDriver | NearbyRide) & { distance_from_me?: number };

interface RideCardProps {
  ride: AnyRide;
  onPress?: () => void;
}

export function RideCard({ ride, onPress }: RideCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const driver = ride.driver;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.9 : 1 }} className="mb-3">
          {/* Driver row */}
          <View className="mb-3 flex-row items-center">
            <Avatar
              uri={driver?.profile_picture}
              name={driver?.full_name}
              size={44}
            />
            <View className="ml-3 flex-1">
              <Text
                style={{ fontFamily: fonts.semibold }}
                className="text-base text-primary"
                numberOfLines={1}
              >
                {driver?.full_name ?? t("rideCard.driver")}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <RatingStars rating={driver?.rating ?? 0} size={12} />
                {driver?.vehicle_plate_number ? (
                  <Text
                    style={{ fontFamily: fonts.regular }}
                    className="ml-2 text-xs text-muted"
                  >
                    · {driver.vehicle_plate_number}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="items-end">
              <Text
                style={{ fontFamily: fonts.bold }}
                className="text-base text-primary"
              >
                {formatPrice(ride.price)}
              </Text>
              <Text
                style={{ fontFamily: fonts.regular }}
                className="text-xs text-muted"
              >
                {t("rideCard.perSeat")}
              </Text>
            </View>
          </View>

          {/* Route */}
          <View className="rounded-xl bg-background p-3">
            <View className="flex-row items-center">
              <MapPin size={14} color={colors.accent} />
              <Text
                style={{ fontFamily: fonts.medium }}
                className="ml-2 flex-1 text-sm text-primary"
                numberOfLines={1}
              >
                {ride.pickup_label}
              </Text>
            </View>
            <View className="my-1 ml-1.5 h-4 w-px bg-border" />
            <View className="flex-row items-center">
              <MapPin size={14} color={colors.primary} />
              <Text
                style={{ fontFamily: fonts.medium }}
                className="ml-2 flex-1 text-sm text-primary"
                numberOfLines={1}
              >
                {ride.destination_label}
              </Text>
            </View>
          </View>

          {/* Meta */}
          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Clock size={13} color={colors.muted} />
              <Text
                style={{ fontFamily: fonts.regular }}
                className="ml-1.5 text-xs text-muted"
              >
                {formatDeparture(ride.departure_time)}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Users size={13} color={colors.muted} />
              <Text
                style={{ fontFamily: fonts.regular }}
                className="ml-1.5 text-xs text-muted"
              >
                {t("rideCard.left", { count: ride.available_seats })}
              </Text>
            </View>

            {ride.distance_from_me != null ? (
              <View className="flex-row items-center">
                <ArrowRight size={13} color={colors.muted} />
                <Text
                  style={{ fontFamily: fonts.regular }}
                  className="ml-1.5 text-xs text-muted"
                >
                  {t("rideCard.away", {
                    distance: formatDistance(ride.distance_from_me),
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>
      )}
    </Pressable>
  );
}
