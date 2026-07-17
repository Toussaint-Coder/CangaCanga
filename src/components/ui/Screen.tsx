import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/utils/cn";

interface ScreenProps extends ViewProps {
  edges?: Edge[];
  padded?: boolean;
}

/** Standard screen wrapper: background color + safe area. */
export function Screen({
  edges = ["top"],
  padded = false,
  className,
  children,
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      <View className={cn("flex-1", padded && "px-5", className)} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}
