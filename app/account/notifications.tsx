import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, Pressable, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  cancelDailyRideReminders,
  scheduleDailyRideReminders,
} from "@/features/notifications/dailyReminders";
import {
  ensureNotificationPermissions,
} from "@/features/notifications/push";
import {
  getNotificationPrefs,
  setNotificationPrefs,
  type NotificationPrefs,
} from "@/features/account/preferences";
import { fonts, useThemeColors } from "@/theme";

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    pushEnabled: true,
    dailyReminders: true,
  });
  const [osGranted, setOsGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const refresh = useCallback(async () => {
    const stored = await getNotificationPrefs();
    setPrefs(stored);
    const notif = await Notifications.getPermissionsAsync();
    setOsGranted(notif.status === "granted");
    const loc = await Location.getForegroundPermissionsAsync();
    setLocationGranted(loc.status === "granted");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updatePrefs = async (next: NotificationPrefs) => {
    setPrefs(next);
    await setNotificationPrefs(next);
    if (next.dailyReminders && next.pushEnabled) {
      const ok = await ensureNotificationPermissions();
      if (ok) await scheduleDailyRideReminders();
      else await cancelDailyRideReminders();
    } else {
      await cancelDailyRideReminders();
    }
  };

  const openSettings = () => {
    Alert.alert(
      t("account.notifications.openSettingsTitle"),
      t("account.notifications.openSettingsBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("account.notifications.openSettingsAction"),
          onPress: () => Linking.openSettings(),
        },
      ],
    );
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("account.notifications.title")} />
      <View className="px-5">
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mb-4 text-sm text-muted"
        >
          {t("account.notifications.intro")}
        </Text>

        <Card className="mb-3">
          <PrefRow
            title={t("account.notifications.push")}
            subtitle={t("account.notifications.pushDesc")}
            value={prefs.pushEnabled && osGranted}
            onValueChange={async (v) => {
              if (v) {
                const ok = await ensureNotificationPermissions();
                if (!ok) {
                  openSettings();
                  return;
                }
              }
              await updatePrefs({ ...prefs, pushEnabled: v });
            }}
            colors={colors}
          />
          <View className="my-3 h-px bg-border" />
          <PrefRow
            title={t("account.notifications.daily")}
            subtitle={t("account.notifications.dailyDesc")}
            value={prefs.dailyReminders && osGranted}
            onValueChange={async (v) => {
              if (v && !osGranted) {
                const ok = await ensureNotificationPermissions();
                if (!ok) {
                  openSettings();
                  return;
                }
              }
              await updatePrefs({ ...prefs, dailyReminders: v });
            }}
            colors={colors}
          />
        </Card>

        <Card className="mb-3">
          <Text
            style={{ fontFamily: fonts.medium }}
            className="mb-1 text-sm text-primary"
          >
            {t("account.notifications.location")}
          </Text>
          <Text
            style={{ fontFamily: fonts.regular }}
            className="mb-3 text-xs text-muted"
          >
            {t("account.notifications.locationDesc")}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={openSettings}
            className="rounded-xl border border-border px-3 py-3"
          >
            <Text
              style={{ fontFamily: fonts.medium }}
              className="text-sm text-accent"
            >
              {locationGranted
                ? t("account.notifications.manageInSettings")
                : t("account.notifications.enableLocation")}
            </Text>
          </Pressable>
        </Card>

        <Text
          style={{ fontFamily: fonts.regular }}
          className="text-xs text-mutedLight"
        >
          {Platform.OS === "ios"
            ? t("account.notifications.iosHint")
            : t("account.notifications.androidHint")}
        </Text>
      </View>
    </Screen>
  );
}

function PrefRow({
  title,
  subtitle,
  value,
  onValueChange,
  colors,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: { accent: string; border: string };
}) {
  return (
    <View className="flex-row items-center">
      <View className="mr-3 flex-1">
        <Text
          style={{ fontFamily: fonts.medium }}
          className="text-sm text-primary"
        >
          {title}
        </Text>
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-1 text-xs text-muted"
        >
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        accessibilityLabel={title}
      />
    </View>
  );
}
