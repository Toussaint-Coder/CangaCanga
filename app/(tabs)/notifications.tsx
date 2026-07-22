import { useEffect } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/EmptyState";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/notifications.hooks";
import { clearBadge } from "@/features/notifications/push";
import { fonts, useThemeColors, type ThemeColors } from "@/theme";
import { formatRelative } from "@/utils/format";
import type { NotificationType } from "@/types/database";
import type { AppNotification } from "@/types/models";

function buildIconMap(
  colors: ThemeColors,
): Record<NotificationType, { icon: IconName; color: string }> {
  return {
    reservation_requested: { icon: "notifications", color: colors.accent },
    reservation_accepted: { icon: "check", color: colors.success },
    reservation_rejected: { icon: "close", color: colors.danger },
    ride_cancelled: { icon: "cancel", color: colors.danger },
    ride_reminder: { icon: "event", color: colors.warning },
    nearby_ride: { icon: "directions-car", color: colors.primary },
  };
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const iconFor = buildIconMap(colors);
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  useEffect(() => {
    void clearBadge();
  }, []);

  const handlePress = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id);
    const rideId = (n.data as { ride_id?: string })?.ride_id;
    if (rideId) router.push(`/ride/${rideId}`);
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Typography variant="title">{t("notifications.title")}</Typography>
        {(data ?? []).some((n) => !n.read) ? (
          <Pressable onPress={() => markAll.mutate()}>
            <Text className="text-sm font-medium text-accent">
              {t("notifications.markAllRead")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = iconFor[item.type];
          return (
            <Pressable
              onPress={() => handlePress(item)}
              className="mb-2 flex-row items-start rounded-2xl border border-border bg-card p-4"
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: cfg.color + "1A" }}
              >
                <Icon name={cfg.icon} size={18} color={cfg.color} />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  style={{ fontFamily: fonts.semibold }}
                  className="text-sm text-primary"
                >
                  {item.title}
                </Text>
                <Text
                  style={{ fontFamily: fonts.regular }}
                  className="mt-0.5 text-sm text-muted"
                >
                  {item.body}
                </Text>
                <Text
                  style={{ fontFamily: fonts.regular }}
                  className="mt-1 text-xs text-mutedLight"
                >
                  {formatRelative(item.created_at)}
                </Text>
              </View>
              {!item.read ? (
                <View className="ml-2 mt-1 h-2 w-2 rounded-full bg-accent" />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="notifications-off"
              title={t("notifications.emptyTitle")}
              description={t("notifications.emptyDesc")}
            />
          )
        }
      />
    </Screen>
  );
}
