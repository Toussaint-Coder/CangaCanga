import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persistent key/value storage.
 *
 * Backed by AsyncStorage so the app runs in Expo Go (which cannot load
 * custom native modules like MMKV). The API is asynchronous.
 */

/** Async storage adapter for supabase-js (SupportedStorage shape). */
export const authStorageAdapter = {
  getItem: (key: string): Promise<string | null> => AsyncStorage.getItem(key),
  setItem: (key: string, value: string): Promise<void> =>
    AsyncStorage.setItem(key, value),
  removeItem: (key: string): Promise<void> => AsyncStorage.removeItem(key),
};

/** Typed JSON helpers. */
export const persist = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

export const STORAGE_KEYS = {
  onboardingSeen: "onboarding_seen",
  lastKnownLocation: "last_known_location",
  language: "language",
  theme: "theme",
} as const;
