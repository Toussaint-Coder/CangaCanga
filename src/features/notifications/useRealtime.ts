import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryClient";
import { supabase } from "@/services/supabase";
import { useCurrentUserId } from "@/stores/authStore";
import type { AppNotification } from "@/types/models";
import { ensureAndroidChannel, presentLocalNotification } from "./push";

/**
 * Subscribes to Supabase Realtime for the signed-in user. This is the app's
 * event bus (replacing Socket.io): it reacts to new notifications and to
 * reservation changes and keeps React Query caches fresh in real time.
 *
 * Mounted once near the root while authenticated.
 */
export function useRealtime(onNotification?: (n: AppNotification) => void) {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  const presentedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!userId) return;

    void ensureAndroidChannel();

    const channel: RealtimeChannel = supabase
      .channel(`user:${userId}:notifications`)
      // notification_received
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
          qc.invalidateQueries({
            queryKey: queryKeys.notifications.unreadCount,
          });
          const notification = payload.new as AppNotification;
          // Deduplicate rapid double-fires from Realtime reconnects.
          if (notification?.id && presentedIds.current.has(notification.id)) {
            return;
          }
          if (notification?.id) {
            presentedIds.current.add(notification.id);
            // Bound the set so it cannot grow forever.
            if (presentedIds.current.size > 200) {
              const first = presentedIds.current.values().next().value;
              if (first) presentedIds.current.delete(first);
            }
          }
          // Foreground presentation: plays the custom sound + vibrates in-app.
          // (Background/killed delivery is handled by remote push.)
          void presentLocalNotification(notification);
          onNotification?.(notification);
        },
      )
      // reservation_requested / accepted / rejected (as passenger)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `passenger_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: queryKeys.reservations.mine });
        },
      )
      // reservation activity on my rides (as driver) — no server-side filter
      // for the join, so refresh the driver caches broadly.
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          qc.invalidateQueries({ queryKey: queryKeys.rides.mine });
        },
      )
      .subscribe((status, err) => {
        if (__DEV__ && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          console.warn("[realtime] notifications channel", status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, onNotification]);
}
