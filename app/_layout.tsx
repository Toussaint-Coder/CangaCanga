import "react-native-gesture-handler";
import "react-native-get-random-values";
import "../global.css";
import "@/i18n";

import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { queryClient } from "@/lib/queryClient";
import { hydrateLanguage } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useThemeColors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const initialize = useAuthStore((s) => s.initialize);
  const status = useAuthStore((s) => s.status);
  const colors = useThemeColors();
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    Promise.all([hydrateLanguage(), useThemeStore.getState().hydrate()]).finally(
      () => setPrefsReady(true),
    );
  }, []);

  useEffect(() => {
    if (fontsLoaded && prefsReady && status !== "loading") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, prefsReady, status]);

  if (!fontsLoaded || !prefsReady || status === "loading") {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="ride/[id]" />
            <Stack.Screen
              name="ride/create"
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="profile/edit"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
