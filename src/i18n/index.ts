import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import "dayjs/locale/en";
import "dayjs/locale/sw";

import { persist, STORAGE_KEYS } from "@/lib/storage";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { sw } from "./locales/sw";
import { rn } from "./locales/rn";

export const LANGUAGES = [
  { code: "rn", label: "Ikirundi" },
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "rn";

/** Dayjs has no Kirundi locale — fall back to French (common in Burundi). */
const DAYJS_LOCALE: Record<LanguageCode, string> = {
  en: "en",
  fr: "fr",
  sw: "sw",
  rn: "fr",
};

function syncDayjsLocale(code: string) {
  const mapped = DAYJS_LOCALE[code as LanguageCode] ?? "fr";
  dayjs.locale(mapped);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    sw: { translation: sw },
    rn: { translation: rn },
  },
  // The app is in Kirundi by default until the user changes it.
  lng: DEFAULT_LANGUAGE,
  fallbackLng: ["rn", "fr", "en"],
  interpolation: { escapeValue: false },
  returnNull: false,
  // Use i18next's built-in plural resolver (singular / *_plural keys) instead of
  // Intl.PluralRules, which is not reliably available on Hermes/React Native.
  compatibilityJSON: "v3",
});

syncDayjsLocale(i18n.language);
i18n.on("languageChanged", syncDayjsLocale);

/** Load the persisted language (if any) on app start. */
export async function hydrateLanguage(): Promise<void> {
  const saved = await persist.get<LanguageCode>(STORAGE_KEYS.language);
  if (saved && saved !== i18n.language) {
    await i18n.changeLanguage(saved);
  }
}

/** Change the active language and persist the choice. */
export async function setLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  await persist.set(STORAGE_KEYS.language, code);
  // Refresh daily reminder copy in the newly selected language.
  const { scheduleDailyRideReminders } = await import(
    "@/features/notifications/dailyReminders"
  );
  void scheduleDailyRideReminders();
}

export default i18n;
