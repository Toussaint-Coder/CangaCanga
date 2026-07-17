import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryClient";
import { supabase } from "@/services/supabase";
import { useCurrentUserId } from "@/stores/authStore";
import type { AppNotification } from "@/types/models";
import { presentLocalNotification } from "./push";

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

  useEffect(() => {
    if (!userId) return;

    const channel: RealtimeChannel = supabase
      .channel(`user:${userId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, onNotification]);
}
