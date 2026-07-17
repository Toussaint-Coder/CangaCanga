import { useEffect, useRef } from "react";
import { Platform } from "react-native";
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
  registerForPushNotificationsAsync,
  setCurrentPushToken,
} from "./push";

// Install the foreground handler once at module load, before any component
// mounts, so notifications received during startup are handled correctly.
configureNotificationHandler();

function devicePlatform(): DevicePlatform {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

/** Follows a notification's `ride_id` into the ride detail screen, if present. */
function useNotificationNavigation() {
  const router = useRouter();
  return (data: unknown) => {
    const rideId = (data as { ride_id?: string } | null)?.ride_id;
    if (rideId) router.push(`/ride/${rideId}`);
  };
}

/**
 * Registers this device for push notifications and wires up tap handling.
 * Mount once inside the authenticated area of the app.
 *
 * - Registers the Expo push token and stores it in Supabase so the backend can
 *   deliver notifications while the app is backgrounded or killed.
 * - Handles the user tapping a notification (foreground, background, or from a
 *   cold start) by navigating to the relevant ride and refreshing caches.
 */
export function usePushNotifications() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  const navigateFromData = useNotificationNavigation();
  const handledColdStart = useRef(false);

  // Register token whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      await ensureAndroidChannel();
      const token = await registerForPushNotificationsAsync();
      if (cancelled || !token) return;
      setCurrentPushToken(token);
      try {
        await savePushToken(token, devicePlatform());
      } catch {
        // Non-fatal: in-app notifications still work via realtime.
      }
    })();

    return () => {
      cancelled = true;
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
