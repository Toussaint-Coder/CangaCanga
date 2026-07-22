import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import i18n from "@/i18n";
import {
  ANDROID_CHANNEL_ID,
  ensureAndroidChannel,
  LOCAL_SOURCE,
  NOTIFICATION_SOUND,
  VIBRATION_PATTERN,
} from "./push";

export const DAILY_REMINDER_TYPE = "daily-ride-reminder";

const REMINDER_IDS = {
  morning: "daily-ride-reminder-morning",
  evening: "daily-ride-reminder-evening",
} as const;

const SLOTS = [
  { id: REMINDER_IDS.morning, hour: 7, minute: 30 },
  { id: REMINDER_IDS.evening, hour: 17, minute: 30 },
] as const;

/** Cancels both daily ride-reminder notifications, if scheduled. */
export async function cancelDailyRideReminders(): Promise<void> {
  await Promise.all(
    Object.values(REMINDER_IDS).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}

/**
 * Schedules repeating local notifications at 07:30 and 17:30 every day,
 * prompting the user to book or create a ride. Safe to call repeatedly —
 * existing reminders are replaced (so language changes update the copy).
 * No-op when notification permission is not granted.
 */
export async function scheduleDailyRideReminders(): Promise<void> {
  try {
    await ensureAndroidChannel();

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    await cancelDailyRideReminders();

    const title = i18n.t("notifications.dailyReminder.title");
    const body = i18n.t("notifications.dailyReminder.body");

    for (const slot of SLOTS) {
      await Notifications.scheduleNotificationAsync({
        identifier: slot.id,
        content: {
          title,
          body,
          sound: NOTIFICATION_SOUND,
          data: {
            source: LOCAL_SOURCE,
            type: DAILY_REMINDER_TYPE,
          },
          ...(Platform.OS === "android"
            ? { vibrate: VIBRATION_PATTERN }
            : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slot.hour,
          minute: slot.minute,
          ...(Platform.OS === "android"
            ? { channelId: ANDROID_CHANNEL_ID }
            : {}),
        },
      });
    }
  } catch {
    // Non-fatal: reminders are best-effort.
  }
}
