import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

import { env } from "@/config/env";
import { authStorageAdapter } from "@/lib/storage";
import type { Database } from "@/types/database";

/**
 * Single shared Supabase client. Auth session is persisted via AsyncStorage so
 * the user stays logged in across app restarts (as required by the spec).
 */
export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      storage: authStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  },
);

// Keep the access token fresh while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
