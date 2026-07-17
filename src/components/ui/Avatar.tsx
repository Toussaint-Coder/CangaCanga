import { Text, View } from "react-native";
import { Image } from "expo-image";

import { fonts, useThemeColors } from "@/theme";
import { initials } from "@/utils/cn";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const colors = useThemeColors();
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={dimension}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
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
  );
}
