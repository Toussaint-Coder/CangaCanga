import { Platform, Vibration } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import type { AppNotification } from "@/types/models";

/**
 * Custom sound bundled via the `expo-notifications` config plugin
 * (see app.config.ts -> sounds). Referenced by file name (no extension on
 * iOS is fine; Android maps it to a raw resource of the same name).
 */
export const NOTIFICATION_SOUND = "notification_sound.wav";

/** Android channel that carries the custom sound + vibration + heads-up. */
export const ANDROID_CHANNEL_ID = "default";

/** Vibration pattern used both for the channel and in-app haptics (ms). */
export const VIBRATION_PATTERN = [0, 250, 150, 250];

/** Marks notifications we present locally so the handler can tell them apart
 *  from remote pushes (which we suppress in the foreground to avoid dupes). */
export const LOCAL_SOURCE = "cangacanga-local";

let handlerConfigured = false;

/**
 * Installs the foreground presentation handler so banners/sound work while the
 * app is open. In the background the OS presents remote pushes directly.
 */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () =>
      // Always present while foregrounded. Suppressing remote pushes here used
      // to hide everything whenever Realtime failed — better a rare duplicate
      // than a silent miss.
      ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowAlert: true,
      }) as Notifications.NotificationBehavior,
  });
}

/**
 * Creates the Android notification channel. On Android the channel — not the
 * payload — owns the sound, vibration and importance, so this must exist before
 * any notification is delivered. No-op on iOS.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "General",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: VIBRATION_PATTERN,
    enableVibrate: true,
    sound: NOTIFICATION_SOUND,
    lightColor: "#2563EB",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

/** Resolves the EAS project id required by Expo push token registration. */
function resolveEasProjectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    undefined
  );
}

/**
 * Requests notification permission (with iOS alert/sound/badge options).
 * Returns true when granted.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowDisplayInCarPlay: false,
    },
  });
  return req.status === "granted";
}

/**
 * Requests permission and returns the Expo push token for this device, or null
 * when running on a simulator / when permission is denied. The token is what
 * the backend uses to deliver notifications while the app is backgrounded or
 * killed.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await ensureAndroidChannel();

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    if (__DEV__) console.warn("[push] Notification permission not granted");
    return null;
  }

  if (!Device.isDevice) {
    // Push tokens are only issued on physical devices; local notifications
    // (Realtime + daily reminders) still work on simulators.
    if (__DEV__) console.warn("[push] Skipping Expo push token on simulator");
    return null;
  }

  const projectId = resolveEasProjectId();
  if (!projectId) {
    if (__DEV__) {
      console.warn(
        "[push] Missing EAS projectId. Set EXPO_PUBLIC_EAS_PROJECT_ID in .env " +
          "(or extra.eas.projectId in app.config.ts) and rebuild.",
      );
    }
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (__DEV__) console.log("[push] Expo push token registered");
    return data;
  } catch (err) {
    if (__DEV__) console.warn("[push] getExpoPushTokenAsync failed", err);
    return null;
  }
}

/**
 * Presents a notification immediately for a row received over Supabase Realtime
 * while the app is in the foreground. Plays the custom sound and vibrates.
 */
export async function presentLocalNotification(
  n: AppNotification,
): Promise<void> {
  try {
    await ensureAndroidChannel();
    Vibration.vibrate(VIBRATION_PATTERN);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: n.title,
        body: n.body,
        data: {
          ...(n.data ?? {}),
          source: LOCAL_SOURCE,
          type: n.type,
          notificationId: n.id,
          ride_id:
            (n.data as { ride_id?: string } | null)?.ride_id ?? undefined,
        },
        sound: NOTIFICATION_SOUND,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === "android"
          ? { vibrate: VIBRATION_PATTERN }
          : {}),
      },
      // null = show immediately. On Android, channelId routes through our
      // high-importance channel so sound + heads-up work.
      trigger:
        Platform.OS === "android"
          ? { channelId: ANDROID_CHANNEL_ID }
          : null,
    });
  } catch (err) {
    if (__DEV__) console.warn("[push] presentLocalNotification failed", err);
  }
}

/** Clears the app icon badge (call when the notifications screen is opened). */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * The Expo push token registered for the current device/session, kept so it can
 * be removed on sign-out. Not persisted — it's re-fetched on each launch.
 */
let currentPushToken: string | null = null;

export function getCurrentPushToken(): string | null {
  return currentPushToken;
}

export function setCurrentPushToken(token: string | null): void {
  currentPushToken = token;
}
