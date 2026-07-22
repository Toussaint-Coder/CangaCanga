import { Text, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/Icon";
import { fonts, useThemeColors } from "@/theme";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
        <Icon name={icon} size={28} color={colors.muted} />
      </View>
      <Text
        style={{ fontFamily: fonts.semibold }}
        className="text-center text-lg text-primary"
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-1.5 text-center text-sm text-muted"
        >
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-5 w-full">{action}</View> : null}
    </View>
  );
}
