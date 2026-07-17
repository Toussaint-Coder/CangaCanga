/**
 * Centralised, validated access to environment variables.
 *
 * Only variables prefixed with EXPO_PUBLIC_ are available in the client bundle.
 * We fail loudly in development if a required value is missing so that
 * misconfiguration is caught early rather than at runtime deep in a screen.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    if (__DEV__) {
      console.warn(
        `[env] Missing required environment variable: ${name}. ` +
          `Did you copy .env.example to .env?`,
      );
    }
    return "";
  }
  return value;
}

export const env = {
  supabase: {
    url: required(process.env.EXPO_PUBLIC_SUPABASE_URL, "EXPO_PUBLIC_SUPABASE_URL"),
    anonKey: required(
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    ),
  },
  auth: {
    // Domain backing the phone->pseudo-email auth accounts. Supabase now does a
    // live DNS lookup on this domain, so it must be a real, resolvable domain
    // (no email is ever sent to it since email confirmation is disabled).
    emailDomain: process.env.EXPO_PUBLIC_AUTH_EMAIL_DOMAIN || "gmail.com",
  },
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
  },
  r2: {
    // Only the PUBLIC bucket URL is needed on the client (to display images).
    // All R2 credentials live server-side in the `r2-presign` Edge Function.
    publicUrl: process.env.EXPO_PUBLIC_R2_PUBLIC_URL ?? "",
  },
} as const;

export const isMapboxConfigured = () => env.mapbox.accessToken.length > 0;
