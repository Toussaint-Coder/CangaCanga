import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryClient";
import { useCurrentUserId } from "@/stores/authStore";
import type { DevicePlatform } from "@/types/database";
import { savePushToken } from "./notifications.service";
import {
  configureNotificationHandler,
  ensureAndroidChannel,
  ensureNotificationPermissions,
  registerForPushNotificationsAsync,
  setCurrentPushToken,
} from "./push";
import {
  DAILY_REMINDER_TYPE,
  scheduleDailyRideReminders,
} from "./dailyReminders";

// Install the foreground handler once at module load, before any component
// mounts, so notifications received during startup are handled correctly.
try {
  configureNotificationHandler();
} catch {
  // Never let notification setup crash app startup.
}

function devicePlatform(): DevicePlatform {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

/** Opens ride detail when `ride_id` is present; daily reminders go to home. */
function useNotificationNavigation() {
  const router = useRouter();
  return (data: unknown) => {
    const payload = data as {
      ride_id?: string;
      type?: string;
    } | null;
    if (payload?.ride_id) {
      router.push(`/ride/${payload.ride_id}`);
      return;
    }
    if (payload?.type === DAILY_REMINDER_TYPE) {
      router.push("/(tabs)");
    }
  };
}

/**
 * Registers this device for push notifications and wires up tap handling.
 * Mount once inside the authenticated area of the app.
 *
 * - Registers the Expo push token and stores it in Supabase so the backend can
 *   deliver notifications while the app is backgrounded or killed.
 * - Schedules daily local reminders (07:30 / 17:30) to book or create a ride.
 * - Handles the user tapping a notification (foreground, background, or from a
 *   cold start) by navigating to the relevant ride and refreshing caches.
 */
export function usePushNotifications() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  const navigateFromData = useNotificationNavigation();
  const handledColdStart = useRef(false);

  // Register token whenever the signed-in user changes (and when returning
  // to foreground, in case permission was granted in system settings).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const register = async () => {
      await ensureAndroidChannel();
      await ensureNotificationPermissions();
      if (!cancelled) {
        void scheduleDailyRideReminders();
      }

      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token) return;
      setCurrentPushToken(token);
      try {
        await savePushToken(token, devicePlatform());
      } catch (err) {
        if (__DEV__) console.warn("[push] savePushToken failed", err);
      }
    };

    void register();

    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") void register();
    });

    return () => {
      cancelled = true;
      appSub.remove();
    };
  }, [userId]);

  // Handle notification taps + cold-start navigation.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
        qc.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount,
        });
        navigateFromData(data);
      },
    );

    // If the app was launched by tapping a notification (cold start).
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || handledColdStart.current) return;
      handledColdStart.current = true;
      navigateFromData(response.notification.request.content.data);
    });

    return () => sub.remove();
  }, [qc, navigateFromData]);
}
