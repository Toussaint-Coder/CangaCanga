import { Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

import { isUserOnline } from "@/features/presence/presence";
import { fonts, useThemeColors } from "@/theme";
import { initials } from "@/utils/cn";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  /** Show online/offline indicator when lastSeenAt is provided. */
  lastSeenAt?: string | null;
  showPresence?: boolean;
}

export function Avatar({
  uri,
  name,
  size = 48,
  lastSeenAt,
  showPresence = false,
}: AvatarProps) {
  const colors = useThemeColors();
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const online = showPresence && isUserOnline(lastSeenAt);
  const dot = Math.max(10, Math.round(size * 0.28));

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={dimension}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View
          style={[dimension, { backgroundColor: colors.background }]}
          className="items-center justify-center border border-border"
        >
          <Text
            style={{ fontFamily: fonts.semibold, fontSize: size * 0.36 }}
            className="text-muted"
          >
            {initials(name)}
          </Text>
        </View>
      )}

      {showPresence ? (
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: online ? "#22C55E" : "#9CA3AF",
            borderWidth: 2,
            borderColor: colors.card,
          }}
        />
      ) : null}
    </View>
  );
}

/** Compact text label: Online / Offline */
export function PresenceLabel({
  lastSeenAt,
  className,
}: {
  lastSeenAt?: string | null;
  className?: string;
}) {
  const { t } = useTranslation();
  const online = isUserOnline(lastSeenAt);
  return (
    <Text
      style={{ fontFamily: fonts.medium }}
      className={
        className ??
        (online ? "text-xs text-success" : "text-xs text-muted")
      }
    >
      {online ? t("common.online") : t("common.offline")}
    </Text>
  );
}
