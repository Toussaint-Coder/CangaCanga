import { Text, View } from "react-native";

import { fonts } from "@/theme";
import { cn } from "@/utils/cn";

type Tone = "neutral" | "accent" | "success" | "danger" | "warning";

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  neutral: { bg: "bg-background", text: "text-muted" },
  accent: { bg: "bg-accent/10", text: "text-accent" },
  success: { bg: "bg-success/10", text: "text-success" },
  danger: { bg: "bg-danger/10", text: "text-danger" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
};

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  const s = toneStyles[tone];
  return (
    <View className={cn("self-start rounded-full px-2.5 py-1", s.bg)}>
      <Text
        style={{ fontFamily: fonts.medium }}
        className={cn("text-xs", s.text)}
      >
        {label}
      </Text>
    </View>
  );
}
