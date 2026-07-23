import { AppState, type AppStateStatus } from "react-native";
import { useEffect } from "react";

import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";

/** Consider a user online if they were seen within this window. */
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 45_000;

export function isUserOnline(lastSeenAt?: string | null): boolean {
  if (!lastSeenAt) return false;
  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) return false;
  return Date.now() - seen < ONLINE_THRESHOLD_MS;
}

export async function touchMyPresence(): Promise<void> {
  const { error } = await supabase.rpc("touch_my_presence");
  if (error) {
    // Fallback if the migration RPC is not applied yet.
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", auth.user.id);
  }
}

/**
 * Keeps `profiles.last_seen_at` fresh while the user is signed in and the app
 * is in the foreground.
 */
export function usePresenceHeartbeat() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== "authenticated") return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let appState: AppStateStatus = AppState.currentState;

    const start = () => {
      void touchMyPresence();
      if (interval) clearInterval(interval);
      interval = setInterval(() => void touchMyPresence(), HEARTBEAT_MS);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    if (appState === "active") start();

    const sub = AppState.addEventListener("change", (next) => {
      appState = next;
      if (next === "active") start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [status]);
}
