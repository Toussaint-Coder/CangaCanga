import { View, type ViewProps } from "react-native";

import { shadow } from "@/theme";
import { cn } from "@/utils/cn";

interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
}

export function Card({
  elevated = true,
  padded = true,
  className,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[elevated ? shadow.card : undefined, style]}
      className={cn(
        "rounded-2xl border border-border bg-card",
        padded && "p-4",
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}
