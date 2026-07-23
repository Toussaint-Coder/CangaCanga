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
import { useFonts } from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { hydrateLanguage } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useThemeColors } from "@/theme";
import { AppErrorBoundary } from "@/components/ui/AppErrorBoundary";
import { usePresenceHeartbeat } from "@/features/presence/presence";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Lufga-Light": require("../assets/fonts/fonnts.com-LufgaLight.ttf"),
    "Lufga-Regular": require("../assets/fonts/fonnts.com-LufgaRegular.ttf"),
    "Lufga-Medium": require("../assets/fonts/fonnts.com-LufgaMedium.ttf"),
    "Lufga-SemiBold": require("../assets/fonts/fonnts.com-LufgaSemiBold.ttf"),
    "Lufga-Bold": require("../assets/fonts/fonnts.com-LufgaBold.ttf"),
    "Lufga-ExtraBold": require("../assets/fonts/fonnts.com-LufgaExtraBold.ttf"),
  });

  const initialize = useAuthStore((s) => s.initialize);
  const status = useAuthStore((s) => s.status);
  const colors = useThemeColors();
  const [prefsReady, setPrefsReady] = useState(false);
  // When true we stop blocking on fonts/auth and show the UI.
  const [bootstrapped, setBootstrapped] = useState(false);

  usePresenceHeartbeat();

  // Prefer a successful font load so Lufga is available before first paint.
  // fontError still unblocks so a bad font asset cannot brick the app forever.
  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    Promise.all([
      hydrateLanguage(),
      useThemeStore.getState().hydrate(),
    ]).finally(() => setPrefsReady(true));
  }, []);

  useEffect(() => {
    if (fontsReady && prefsReady && status !== "loading") {
      setBootstrapped(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, prefsReady, status]);

  // Failsafe: never leave a blank screen if fonts/auth hang.
  useEffect(() => {
    const t = setTimeout(() => {
      setPrefsReady(true);
      setBootstrapped(true);
      SplashScreen.hideAsync().catch(() => {});
      if (useAuthStore.getState().status === "loading") {
        useAuthStore.setState({
          session: null,
          profile: null,
          status: "unauthenticated",
        });
      }
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  if (!bootstrapped) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
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
                name="ride/edit/[id]"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="profile/edit"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="legal/[doc]" />
              <Stack.Screen
                name="account/delete"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="account/password"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="account/notifications"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="account/data"
                options={{ presentation: "modal" }}
              />
            </Stack>
          </QueryClientProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
