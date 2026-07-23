import { persist, STORAGE_KEYS } from "@/lib/storage";

export type NotificationPrefs = {
  /** Master switch for remote push registration intent. */
  pushEnabled: boolean;
  /** Local daily ride reminders at 07:30 / 17:30. */
  dailyReminders: boolean;
};

const DEFAULTS: NotificationPrefs = {
  pushEnabled: true,
  dailyReminders: true,
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const stored = await persist.get<NotificationPrefs>(
    STORAGE_KEYS.notificationPrefs,
  );
  return { ...DEFAULTS, ...(stored ?? {}) };
}

export async function setNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<void> {
  await persist.set(STORAGE_KEYS.notificationPrefs, prefs);
}
