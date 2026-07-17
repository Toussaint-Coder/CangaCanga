import { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Dynamic Expo config.
 *
 * Secrets are read from the environment (see `.env.example`). Nothing is
 * hardcoded here. The Mapbox *download* token (secret scope, starts with
 * `sk.`) is only needed at build time for the native SDK download and is
 * kept separate from the *public* access token used at runtime.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "CangaCanga",
  slug: "cangacanga",
  version: "1.0.0",
  scheme: "cangacanga",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#F8F9FA",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.cangacanga.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "CangaCanga uses your location to show nearby rides and set your pickup point.",
      NSPhotoLibraryUsageDescription:
        "CangaCanga needs access to your photos so you can set a profile picture.",
    },
  },
  android: {
    package: "com.cangacanga.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#F8F9FA",
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "READ_EXTERNAL_STORAGE",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-asset",
    [
      "expo-notifications",
      {
        icon: "./assets/notification_icon.png",
        color: "#2563EB",
        // Bundles the custom sound so it can be referenced by file name
        // ("notification_sound.wav") on the Android channel and in push
        // payloads. WAV (PCM) is used because iOS ignores mp3 for notification
        // sounds; it was converted from the provided notification_sound.mp3.
        sounds: ["./assets/notification_sound.wav"],
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          // Expo SDK 52 defaults to Kotlin 1.9.25; expo-modules-core then
          // selects Compose Compiler 1.5.15. Keep both in sync here so the
          // pairing survives `expo prebuild`.
          kotlinVersion: "1.9.25",
        },
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "CangaCanga uses your location to show nearby rides and set your pickup point.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "CangaCanga needs access to your photos so you can set a profile picture.",
      },
    ],
    [
      "@rnmapbox/maps",
      {
        // Secret download token (sk.*) used only during native build.
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? "",
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F8F9FA",
        image: "./assets/splash.png",
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: { origin: false },
    eas: {},
  },
});
