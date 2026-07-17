import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Car,
  Check,
  ChevronRight,
  Globe,
  LogOut,
  Moon,
  Phone,
  Smartphone,
  Star,
  Sun,
  UserCog,
  Route as RouteIcon,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { useProfileStats } from "@/features/profile/profile.hooks";
import { useLogout } from "@/features/auth/auth.hooks";
import { useAuthStore } from "@/stores/authStore";
import { fonts, useThemeColors } from "@/theme";
import { formatPhoneDisplay } from "@/utils/phone";
import { formatRating } from "@/utils/format";
import { LANGUAGES, setLanguage, type LanguageCode } from "@/i18n";
import {
  THEME_OPTIONS,
  useThemeStore,
  type ThemePreference,
} from "@/stores/themeStore";

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: stats } = useProfileStats(profile?.id);
  const logout = useLogout();

  const confirmLogout = () => {
    Alert.alert(
      t("profile.logoutConfirmTitle"),
      t("profile.logoutConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.logout"),
          style: "destructive",
          onPress: () => logout.mutate(),
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-5 pb-2 pt-2">
          <Typography variant="title">{t("profile.title")}</Typography>
        </View>

        {/* Identity card */}
        <View className="px-5">
          <Card className="items-center py-6">
            <Avatar
              uri={profile?.profile_picture}
              name={profile?.full_name}
              size={88}
            />
            <Typography variant="heading" className="mt-3">
              {profile?.full_name}
            </Typography>
            <View className="mt-1 flex-row items-center">
              <Star size={13} color={colors.star} fill={colors.star} />
              <Text
                style={{ fontFamily: fonts.medium }}
                className="ml-1 text-sm text-muted"
              >
                {formatRating(profile?.rating)}
                {profile?.rating_count
                  ? ` · ${t("profile.reviews", { count: profile.rating_count })}`
                  : ""}
              </Text>
            </View>
          </Card>
        </View>

        {/* Quick stats */}
        <View className="mt-4 flex-row gap-x-3 px-5">
          <StatTile
            icon={RouteIcon}
            label={t("profile.totalTrips")}
            value={String(stats?.totalTrips ?? 0)}
          />
          <StatTile
            icon={Star}
            label={t("profile.rating")}
            value={formatRating(profile?.rating)}
          />
        </View>

        {/* Details */}
        <View className="mt-4 px-5">
          <Card padded={false}>
            <DetailRow
              icon={Phone}
              label={t("profile.phone")}
              value={
                profile
                  ? formatPhoneDisplay(profile.phone_number)
                  : t("common.dash")
              }
            />
            <View className="h-px bg-border" />
            <DetailRow
              icon={Car}
              label={t("profile.vehiclePlate")}
              value={profile?.vehicle_plate_number || t("common.notSet")}
            />
          </Card>
        </View>

        {/* Language */}
        <View className="mt-4 px-5">
          <Text
            style={{ fontFamily: fonts.medium }}
            className="mb-2 ml-1 text-xs text-muted"
          >
            {t("profile.language")}
          </Text>
          <Card padded={false}>
            {LANGUAGES.map((lang, index) => {
              const active = i18n.language === lang.code;
              return (
                <View key={lang.code}>
                  {index > 0 ? <View className="h-px bg-border" /> : null}
                  <Pressable
                    onPress={() => setLanguage(lang.code as LanguageCode)}
                    className="flex-row items-center p-4"
                  >
                    <Globe size={18} color={colors.muted} />
                    <Text
                      style={{ fontFamily: fonts.medium }}
                      className="ml-3 flex-1 text-sm text-primary"
                    >
                      {lang.label}
                    </Text>
                    {active ? (
                      <Check size={18} color={colors.accent} />
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Theme */}
        <View className="mt-4 px-5">
          <Text
            style={{ fontFamily: fonts.medium }}
            className="mb-2 ml-1 text-xs text-muted"
          >
            {t("profile.theme")}
          </Text>
          <Card padded={false}>
            {THEME_OPTIONS.map((option, index) => {
              const active = themePreference === option;
              const Icon =
                option === "light"
                  ? Sun
                  : option === "dark"
                    ? Moon
                    : Smartphone;
              return (
                <View key={option}>
                  {index > 0 ? <View className="h-px bg-border" /> : null}
                  <Pressable
                    onPress={() => setThemePreference(option as ThemePreference)}
                    className="flex-row items-center p-4"
                  >
                    <Icon size={18} color={colors.muted} />
                    <Text
                      style={{ fontFamily: fonts.medium }}
                      className="ml-3 flex-1 text-sm text-primary"
                    >
                      {t(`theme.${option}`)}
                    </Text>
                    {active ? <Check size={18} color={colors.accent} /> : null}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Actions */}
        <View className="mt-4 px-5">
          <Card padded={false}>
            <ActionRow
              icon={UserCog}
              label={t("profile.editProfile")}
              onPress={() => router.push("/profile/edit")}
            />
            <View className="h-px bg-border" />
            <ActionRow
              icon={LogOut}
              label={t("profile.logout")}
              danger
              onPress={confirmLogout}
            />
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <Card className="flex-1">
      <Icon size={18} color={colors.accent} />
      <Text
        style={{ fontFamily: fonts.bold }}
        className="mt-2 text-xl text-primary"
      >
        {value}
      </Text>
      <Text
        style={{ fontFamily: fonts.regular }}
        className="text-xs text-muted"
      >
        {label}
      </Text>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center p-4">
      <Icon size={18} color={colors.muted} />
      <View className="ml-3">
        <Text
          style={{ fontFamily: fonts.regular }}
          className="text-xs text-muted"
        >
          {label}
        </Text>
        <Text
          style={{ fontFamily: fonts.medium }}
          className="text-sm text-primary"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} className="flex-row items-center p-4">
      <Icon size={18} color={danger ? colors.danger : colors.primary} />
      <Text
        style={{ fontFamily: fonts.medium }}
        className={`ml-3 flex-1 text-sm ${danger ? "text-danger" : "text-primary"}`}
      >
        {label}
      </Text>
      {!danger ? <ChevronRight size={18} color={colors.mutedLight} /> : null}
    </Pressable>
  );
}
