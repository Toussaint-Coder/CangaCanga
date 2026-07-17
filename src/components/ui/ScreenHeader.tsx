import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";

import { fonts, useThemeColors } from "@/theme";

interface ScreenHeaderProps {
  title?: string;
  variant?: "back" | "close";
  right?: React.ReactNode;
}

export function ScreenHeader({
  title,
  variant = "back",
  right,
}: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const Icon = variant === "close" ? X : ArrowLeft;

  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <Icon size={18} color={colors.primary} />
      </Pressable>
      {title ? (
        <Text
          style={{ fontFamily: fonts.semibold }}
          className="text-base text-primary"
        >
          {title}
        </Text>
      ) : (
        <View />
      )}
      <View className="h-10 w-10 items-center justify-center">{right}</View>
    </View>
  );
}
