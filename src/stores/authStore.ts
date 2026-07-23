import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/services/supabase";
import { fetchMyProfile } from "@/features/auth/auth.service";
import { deletePushToken } from "@/features/notifications/notifications.service";
import { cancelDailyRideReminders } from "@/features/notifications/dailyReminders";
import { getCurrentPushToken, setCurrentPushToken } from "@/features/notifications/push";
import type { Profile } from "@/types/models";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  /** Wire up the supabase auth listener and load the initial session. */
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  session: null,
  profile: null,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session) {
        try {
          const profile = await fetchMyProfile();
          set({ session, profile, status: "authenticated" });
        } catch {
          // Session exists but profile fetch failed — still let the user in.
          set({ session, profile: null, status: "authenticated" });
        }
      } else {
        set({ session: null, profile: null, status: "unauthenticated" });
      }
    } catch {
      // Never leave the splash screen stuck on a network/storage failure.
      set({ session: null, profile: null, status: "unauthenticated" });
    }

    // Avoid stacking listeners across fast refresh.
    unsubscribe?.();
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (newSession) {
          try {
            const profile = await fetchMyProfile();
            set({
              session: newSession,
              profile,
              status: "authenticated",
            });
          } catch {
            set({
              session: newSession,
              profile: null,
              status: "authenticated",
            });
          }
        } else {
          set({ session: null, profile: null, status: "unauthenticated" });
        }
      },
    );
    unsubscribe = () => sub.subscription.unsubscribe();
  },

  refreshProfile: async () => {
    if (!get().session) return;
    const profile = await fetchMyProfile();
    set({ profile });
  },

  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    // Stop pushes and local reminders reaching this device after sign-out.
    const token = getCurrentPushToken();
    if (token) {
      await deletePushToken(token).catch(() => {});
      setCurrentPushToken(null);
    }
    await cancelDailyRideReminders().catch(() => {});
    await supabase.auth.signOut();
    set({ session: null, profile: null, status: "unauthenticated" });
  },
}));

export const useCurrentUserId = () =>
  useAuthStore((s) => s.session?.user.id ?? null);
