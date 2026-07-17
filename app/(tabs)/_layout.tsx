import { Pressable, View } from "react-native";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Compass,
  Home,
  Plus,
  Ticket,
  User,
} from "lucide-react-native";

import { useAuthStore } from "@/stores/authStore";
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

  // App-wide realtime event bus (replaces Socket.io). Presents in-app
  // notifications (sound + vibration) when new rows arrive.
  useRealtime();
  // Registers the device for background/killed push delivery + tap handling.
  usePushNotifications();

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
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t("tabs.explore"),
            tabBarIcon: ({ color, size }) => (
              <Compass size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: t("tabs.trips"),
            tabBarIcon: ({ color, size }) => (
              <Ticket size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t("tabs.notifications"),
            tabBarIcon: ({ color, size }) => (
              <View>
                <Bell size={size} color={color} />
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
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>

      {/* Floating action button — Create Ride */}
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
        <Plus size={26} color={colors.secondary} />
      </Pressable>
    </View>
  );
}
