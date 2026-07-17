import { create } from "zustand";
import { colorScheme } from "nativewind";

import { persist, STORAGE_KEYS } from "@/lib/storage";

export const THEME_OPTIONS = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_OPTIONS)[number];

interface ThemeState {
  /** The user's chosen preference (may be "system"). */
  preference: ThemePreference;
  /** Apply and persist a new preference. */
  setPreference: (preference: ThemePreference) => void;
  /** Load the persisted preference on app start. */
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  setPreference: (preference) => {
    colorScheme.set(preference);
    set({ preference });
    void persist.set(STORAGE_KEYS.theme, preference);
  },
  hydrate: async () => {
    const saved = await persist.get<ThemePreference>(STORAGE_KEYS.theme);
    const preference = saved ?? "system";
    colorScheme.set(preference);
    set({ preference });
  },
}));
