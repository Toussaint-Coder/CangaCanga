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
const LOCAL_SOURCE = "cangacanga-local";

let handlerConfigured = false;

/**
 * Installs the foreground presentation handler. Local notifications we present
 * from the realtime subscription are shown (banner + sound + badge); remote
 * pushes arriving while the app is foregrounded are suppressed, because the
 * realtime subscription already renders an equivalent local notification and we
 * don't want the user to see it twice. In the background the OS shows the
 * remote push directly (this handler doesn't run there).
 */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isLocal =
        notification.request.content.data?.source === LOCAL_SOURCE;
      return {
        shouldShowBanner: isLocal,
        shouldShowList: true,
        shouldPlaySound: isLocal,
        shouldSetBadge: true,
        // Back-compat fields for older expo-notifications typings.
        shouldShowAlert: isLocal,
      } as Notifications.NotificationBehavior;
    },
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
  });
}

/**
 * Requests permission and returns the Expo push token for this device, or null
 * when running on a simulator / when permission is denied. The token is what
 * the backend uses to deliver notifications while the app is backgrounded or
 * killed.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await ensureAndroidChannel();

  if (!Device.isDevice) {
    // Push tokens are only issued on physical devices.
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return data;
  } catch {
    // Missing EAS projectId or no network — fail soft; in-app notifications
    // still work via the realtime subscription.
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
  // Fire haptics right away so it's felt even before the banner renders.
  Vibration.vibrate(VIBRATION_PATTERN);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: n.title,
      body: n.body,
      data: { ...n.data, source: LOCAL_SOURCE, notificationId: n.id },
      sound: NOTIFICATION_SOUND,
      ...(Platform.OS === "android"
        ? { vibrate: VIBRATION_PATTERN }
        : {}),
    },
    // Present immediately; on Android route through our channel so the custom
    // sound + vibration are applied.
    trigger:
      Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null,
  });
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
