import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/stores/authStore";
import { useThemeColors } from "@/theme";

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const colors = useThemeColors();

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
