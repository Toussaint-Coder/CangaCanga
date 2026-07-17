import { Pressable, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";

import { fonts, useThemeColors } from "@/theme";

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Stepper({ value, min = 1, max = 8, onChange }: StepperProps) {
  const colors = useThemeColors();
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={dec}
        disabled={value <= min}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        style={{ opacity: value <= min ? 0.4 : 1 }}
      >
        <Minus size={18} color={colors.primary} />
      </Pressable>
      <Text
        style={{ fontFamily: fonts.semibold }}
        className="mx-5 min-w-[24px] text-center text-lg text-primary"
      >
        {value}
      </Text>
      <Pressable
        onPress={inc}
        disabled={value >= max}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        style={{ opacity: value >= max ? 0.4 : 1 }}
      >
        <Plus size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}
