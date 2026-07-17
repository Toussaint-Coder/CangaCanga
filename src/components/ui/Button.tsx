import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { MotiView } from "moti";

import { fonts, useThemeColors } from "@/theme";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantBg: Record<Variant, string> = {
  primary: "bg-primary",
  secondary: "bg-accent",
  outline: "bg-transparent border border-border",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

const variantText: Record<Variant, string> = {
  primary: "text-secondary",
  secondary: "text-secondary",
  outline: "text-primary",
  ghost: "text-accent",
  danger: "text-secondary",
};

const sizeStyle: Record<Size, string> = {
  sm: "h-10 px-4 rounded-xl",
  md: "h-12 px-5 rounded-2xl",
  lg: "h-14 px-6 rounded-2xl",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  return (
    <Pressable disabled={isDisabled} {...props}>
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed ? 0.97 : 1, opacity: isDisabled ? 0.5 : 1 }}
          transition={{ type: "timing", duration: 120 }}
          className={cn(
            "flex-row items-center justify-center",
            sizeStyle[size],
            variantBg[variant],
            fullWidth && "w-full",
          )}
        >
          {loading ? (
            <ActivityIndicator
              color={
                variant === "outline" || variant === "ghost"
                  ? colors.primary
                  : colors.secondary
              }
            />
          ) : (
            <View className="flex-row items-center justify-center">
              {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
              <Text
                style={{ fontFamily: fonts.semibold }}
                className={cn("text-base", variantText[variant])}
              >
                {label}
              </Text>
              {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
            </View>
          )}
        </MotiView>
      )}
    </Pressable>
  );
}
