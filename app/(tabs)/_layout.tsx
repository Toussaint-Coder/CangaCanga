import { Pressable, View } from "react-native";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";

import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentLocation } from "@/features/location/location.hooks";
import { useRealtime } from "@/features/notifications/useRealtime";
import { usePushNotifications } from "@/features/notifications/usePushNotifications";
import { useUnreadCount } from "@/features/notifications/notifications.hooks";
import { fonts, shadow, useThemeColors } from "@/theme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const { data: unread } = useUnreadCount();

  useRealtime();
  usePushNotifications();
  // Keep last known location synced for nearby-ride notifications.
  useCurrentLocation();

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedLight,
          tabBarLabelStyle: {
            fontFamily: fonts.medium,
            fontSize: 11,
          },
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t("tabs.explore"),
            tabBarIcon: ({ color, size }) => (
              <Icon name="explore" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: t("tabs.trips"),
            tabBarIcon: ({ color, size }) => (
              <Icon name="confirmation-number" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t("tabs.notifications"),
            tabBarIcon: ({ color, size }) => (
              <View>
                <Icon name="notifications" size={size} color={color} />
                {unread && unread > 0 ? (
                  <View className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-accent" />
                ) : null}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            tabBarIcon: ({ color, size }) => (
              <Icon name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <Pressable
        onPress={() => router.push("/ride/create")}
        style={[
          shadow.floating,
          {
            position: "absolute",
            right: 20,
            bottom: 84,
            height: 56,
            width: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <MotiView
          from={{ translateX: -4 }}
          animate={{ translateX: 4 }}
          transition={{
            type: "timing",
            duration: 700,
            loop: true,
            repeatReverse: true,
          }}
        >
          <Icon name="directions-car" size={26} color={colors.secondary} />
        </MotiView>
      </Pressable>
    </View>
  );
}
