import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/Icon";
import type { SavedRoute } from "@/features/rides/rideDrafts";
import { fonts, useThemeColors } from "@/theme";

type Props = {
  routes: SavedRoute[];
  onSelect: (route: SavedRoute) => void;
};

export function SavedRoutesList({ routes, onSelect }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  if (routes.length === 0) return null;

  return (
    <View className="mb-1">
      <Text
        style={{ fontFamily: fonts.medium }}
        className="mb-2 text-sm text-primary"
      >
        {t("create.savedRoutes")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {routes.map((route) => (
          <Pressable
            key={route.id}
            onPress={() => onSelect(route)}
            className="max-w-[280px] rounded-2xl border border-border bg-card px-3 py-2.5"
          >
            <View className="flex-row items-center">
              <Icon name="alt-route" size={14} color={colors.muted} />
              <Text
                style={{ fontFamily: fonts.semibold }}
                className="ml-1.5 flex-1 text-xs text-primary"
                numberOfLines={1}
              >
                {route.pickup.label}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center">
              <Icon name="place" size={14} color={colors.accent} />
              <Text
                style={{ fontFamily: fonts.regular }}
                className="ml-1.5 flex-1 text-xs text-muted"
                numberOfLines={1}
              >
                {route.destination.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
