import { Text, type TextProps } from "react-native";

import { fonts } from "@/theme";
import { cn } from "@/utils/cn";

type Variant = "display" | "title" | "heading" | "body" | "caption" | "label";

const variantClass: Record<Variant, string> = {
  display: "text-3xl text-primary",
  title: "text-2xl text-primary",
  heading: "text-lg text-primary",
  body: "text-base text-primary",
  caption: "text-sm text-muted",
  label: "text-xs text-muted",
};

const variantFont: Record<Variant, string> = {
  display: fonts.bold,
  title: fonts.bold,
  heading: fonts.semibold,
  body: fonts.regular,
  caption: fonts.regular,
  label: fonts.medium,
};

interface TypographyProps extends TextProps {
  variant?: Variant;
}

export function Typography({
  variant = "body",
  className,
  style,
  ...props
}: TypographyProps) {
  return (
    <Text
      style={[{ fontFamily: variantFont[variant] }, style]}
      className={cn(variantClass[variant], className)}
      {...props}
    />
  );
}
