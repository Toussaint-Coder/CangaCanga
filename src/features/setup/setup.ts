import { persist, STORAGE_KEYS } from "@/lib/storage";
import type { LanguageCode } from "@/i18n";

export type SetupStep =
  | "onboarding"
  | "permissions"
  | "language"
  | "done";

/** Where a first-time (or incomplete) setup should resume. */
export async function getNextSetupStep(): Promise<SetupStep> {
  const [onboarding, permissions, language] = await Promise.all([
    persist.get<boolean>(STORAGE_KEYS.onboardingSeen),
    persist.get<boolean>(STORAGE_KEYS.permissionsSetupSeen),
    persist.get<boolean>(STORAGE_KEYS.languageSetupSeen),
  ]);

  if (onboarding !== true) return "onboarding";
  if (permissions !== true) return "permissions";
  if (language !== true) return "language";
  return "done";
}

export async function markOnboardingSeen(): Promise<void> {
  await persist.set(STORAGE_KEYS.onboardingSeen, true);
}

export async function markPermissionsSetupSeen(): Promise<void> {
  await persist.set(STORAGE_KEYS.permissionsSetupSeen, true);
}

export async function markLanguageSetupSeen(
  code?: LanguageCode,
): Promise<void> {
  if (code) {
    await persist.set(STORAGE_KEYS.language, code);
  }
  await persist.set(STORAGE_KEYS.languageSetupSeen, true);
}

export function setupHref(step: SetupStep): string {
  switch (step) {
    case "onboarding":
      return "/(auth)/onboarding";
    case "permissions":
      return "/(auth)/permissions";
    case "language":
      return "/(auth)/language-setup";
    default:
      return "/(auth)/login";
  }
}
