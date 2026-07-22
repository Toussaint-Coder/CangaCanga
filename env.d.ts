declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    EXPO_PUBLIC_AUTH_EMAIL_DOMAIN?: string;
    EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN: string;
    MAPBOX_DOWNLOAD_TOKEN?: string;
    EXPO_PUBLIC_R2_PUBLIC_URL: string;
    EXPO_PUBLIC_EAS_PROJECT_ID?: string;
  }
}
