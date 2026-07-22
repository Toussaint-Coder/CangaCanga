import { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Fresh Expo config for CangaCanga (SDK 52).
 * Secrets come from `.env` — see `.env.example`.
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
  // Mapbox @rnmapbox/maps hits ViewTagResolver races on RN 0.76 New Arch.
  // Keep Fabric off until a newer Mapbox release is fully verified.
  newArchEnabled: false,
  splash: {
    // Brand logo centered on the brand background (not a full-bleed image).
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
        "CangaCanga needs access to your photos so you can set a profile picture and add a vehicle photo.",
      NSCameraUsageDescription:
        "CangaCanga needs the camera so you can take a profile or vehicle photo.",
      NSPhotoLibraryAddUsageDescription:
        "CangaCanga may save photos you take for your profile or vehicle.",
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
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "READ_MEDIA_IMAGES",
      "POST_NOTIFICATIONS",
      "VIBRATE",
      "RECEIVE_BOOT_COMPLETED",
      "SCHEDULE_EXACT_ALARM",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "expo-asset",
    "expo-font",
    "expo-file-system",
    "./plugins/withAndroidArm64Only",
    [
      "expo-notifications",
      {
        icon: "./assets/notification_icon.png",
        color: "#2563EB",
        sounds: ["./assets/notification_sound.wav"],
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          kotlinVersion: "1.9.25",
          // Keep release packaging simple/reliable. Size is already cut by
          // arm64-only. Enable minify later once the app launches cleanly.
          enableProguardInReleaseBuilds: false,
          enableShrinkResourcesInReleaseBuilds: false,
          useLegacyPackaging: false,
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
          "CangaCanga needs access to your photos so you can set a profile picture and add a vehicle photo.",
        cameraPermission:
          "CangaCanga needs the camera so you can take a profile or vehicle photo.",
      },
    ],
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? "",
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F8F9FA",
        image: "./assets/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: { origin: false },
    eas: {
      // Required for Expo push tokens on physical devices. Set in `.env`:
      // EXPO_PUBLIC_EAS_PROJECT_ID=<uuid from `eas init` / expo.dev>
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "",
    },
  },
});
