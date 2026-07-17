import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Frown, Search } from "lucide-react-native";

import { RideCard } from "@/components/rides/RideCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useRides } from "@/features/rides/rides.hooks";
import { fonts, useThemeColors } from "@/theme";
import { cn } from "@/utils/cn";

const SEAT_OPTIONS = [1, 2, 3, 4];

export default function ExploreScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [seats, setSeats] = useState<number | undefined>(undefined);

  const filters = useMemo(
    () => ({ destination: destination.trim() || undefined, seats }),
    [destination, seats],
  );

  const { data, isLoading, refetch, isRefetching } = useRides(filters);

  return (
    <Screen>
      <View className="px-5 pb-3 pt-2">
        <Typography variant="title">{t("explore.title")}</Typography>
        <Typography variant="caption" className="mt-0.5">
          {t("explore.subtitle")}
        </Typography>

        <View className="mt-4">
          <Input
            placeholder={t("explore.destinationPlaceholder")}
            value={destination}
            onChangeText={setDestination}
            leftIcon={<Search size={18} color={colors.muted} />}
          />
        </View>

        {/* Seat filter */}
        <View className="mt-3 flex-row items-center">
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
                onPress={() => setSeats(active ? undefined : n)}
                className={cn(
                  "mr-2 h-8 w-9 items-center justify-center rounded-full border",
                  active ? "border-accent bg-accent" : "border-border bg-card",
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

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        renderItem={({ item }) => (
          <RideCard ride={item} onPress={() => router.push(`/ride/${item.id}`)} />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-16">
              <Typography variant="caption" className="text-center">
                {t("explore.loading")}
              </Typography>
            </View>
          ) : (
            <EmptyState
              icon={Frown}
              title={t("explore.emptyTitle")}
              description={t("explore.emptyDesc")}
            />
          )
        }
      />
    </Screen>
  );
}
