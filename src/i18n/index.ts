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

export const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "fr";

const SUPPORTED_DAYJS_LOCALES = ["en", "fr", "sw"];

function syncDayjsLocale(code: string) {
  dayjs.locale(SUPPORTED_DAYJS_LOCALES.includes(code) ? code : "fr");
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    sw: { translation: sw },
  },
  // The app is in French by default until the user changes it.
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
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
}

export default i18n;
