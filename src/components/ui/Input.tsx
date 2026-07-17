import { forwardRef, useState } from "react";
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { fonts, useThemeColors } from "@/theme";
import { cn } from "@/utils/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightElement, helperText, style, ...props },
  ref,
) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full">
      {label ? (
        <Text
          style={{ fontFamily: fonts.medium }}
          className="mb-2 text-sm text-primary"
        >
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          "w-full flex-row items-center rounded-2xl border bg-card px-4",
          error
            ? "border-danger"
            : focused
              ? "border-accent"
              : "border-border",
        )}
        style={{ minHeight: 52 }}
      >
        {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedLight}
          selectionColor={colors.accent}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[{ fontFamily: fonts.regular, color: colors.primary }, style]}
          className="flex-1 py-3 text-base"
          {...props}
        />
        {rightElement ? <View className="ml-2">{rightElement}</View> : null}
      </View>

      {error ? (
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-1.5 text-xs text-danger"
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-1.5 text-xs text-muted"
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});
