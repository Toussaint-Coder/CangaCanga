import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import {
  markPermissionsSetupSeen,
} from "@/features/setup/setup";
import { fonts, useThemeColors } from "@/theme";

type PermKey = "location" | "notifications" | "camera";

/**
 * First-launch permissions screen — always shown in French.
 */
export default function PermissionsSetupScreen() {
  const { i18n } = useTranslation();
  const t = i18n.getFixedT("fr");
  const colors = useThemeColors();
  const router = useRouter();
  const [granted, setGranted] = useState<Record<PermKey, boolean>>({
    location: false,
    notifications: false,
    camera: false,
  });

  const refreshStatuses = useCallback(async () => {
    const [loc, notif, cam, lib] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Notifications.getPermissionsAsync(),
      ImagePicker.getCameraPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
    ]);
    setGranted({
      location: loc.status === "granted",
      notifications: notif.status === "granted",
      camera: cam.status === "granted" || lib.status === "granted",
    });
  }, []);

  useEffect(() => {
    void refreshStatuses();
  }, [refreshStatuses]);

  const request = async (key: PermKey) => {
    if (key === "location") {
      await Location.requestForegroundPermissionsAsync();
    } else if (key === "notifications") {
      const { ensureNotificationPermissions } = await import(
        "@/features/notifications/push"
      );
      await ensureNotificationPermissions();
      const { scheduleDailyRideReminders } = await import(
        "@/features/notifications/dailyReminders"
      );
      await scheduleDailyRideReminders();
    } else {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    await refreshStatuses();
  };

  const finish = async () => {
    const { scheduleDailyRideReminders } = await import(
      "@/features/notifications/dailyReminders"
    );
    await scheduleDailyRideReminders();
    await markPermissionsSetupSeen();
    router.replace("/(auth)/language-setup");
  };

  const rows: Array<{
    key: PermKey;
    icon: IconName;
    title: string;
    desc: string;
  }> = [
    {
      key: "location",
      icon: "my-location",
      title: t("setup.permissions.locationTitle"),
      desc: t("setup.permissions.locationDesc"),
    },
    {
      key: "notifications",
      icon: "notifications",
      title: t("setup.permissions.notificationsTitle"),
      desc: t("setup.permissions.notificationsDesc"),
    },
    {
      key: "camera",
      icon: "photo-camera",
      title: t("setup.permissions.cameraTitle"),
      desc: t("setup.permissions.cameraDesc"),
    },
  ];

  return (
    <Screen edges={["top", "bottom"]} padded>
      <View className="flex-1 px-1 pt-4">
        <Text
          style={{ fontFamily: fonts.bold }}
          className="text-3xl text-primary"
        >
          {t("setup.permissions.title")}
        </Text>
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-3 text-base leading-6 text-muted"
        >
          {t("setup.permissions.subtitle")}
        </Text>

        <View className="mt-8 gap-y-3">
          {rows.map((row) => {
            const ok = granted[row.key];
            return (
              <Card key={row.key} className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-background">
                  <Icon name={row.icon} size={22} color={colors.accent} />
                </View>
                <View className="ml-3 flex-1 pr-2">
                  <Text
                    style={{ fontFamily: fonts.semibold }}
                    className="text-base text-primary"
                  >
                    {row.title}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.regular }}
                    className="mt-0.5 text-sm text-muted"
                  >
                    {row.desc}
                  </Text>
                </View>
                {ok ? (
                  <View className="flex-row items-center">
                    <Icon name="check" size={16} color={colors.success} />
                    <Text
                      style={{ fontFamily: fonts.medium }}
                      className="ml-1 text-xs text-success"
                    >
                      {t("setup.permissions.allowed")}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => void request(row.key)}
                    className="rounded-full bg-accent px-3 py-2"
                  >
                    <Text
                      style={{ fontFamily: fonts.semibold }}
                      className="text-xs text-secondary"
                    >
                      {t("setup.permissions.allow")}
                    </Text>
                  </Pressable>
                )}
              </Card>
            );
          })}
        </View>

        <View className="mt-auto gap-y-3 pb-2 pt-8">
          <Button
            label={t("setup.permissions.continue")}
            onPress={() => void finish()}
          />
          <Pressable onPress={() => void finish()} className="items-center py-2">
            <Text
              style={{ fontFamily: fonts.medium }}
              className="text-sm text-muted"
            >
              {t("setup.permissions.later")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
