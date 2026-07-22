import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { fonts, useThemeColors } from "@/theme";
import { formatRating } from "@/utils/format";

interface RatingStarsProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  editable?: boolean;
  onChange?: (value: number) => void;
}

export function RatingStars({
  rating,
  size = 14,
  showValue = true,
  editable = false,
  onChange,
}: RatingStarsProps) {
  const colors = useThemeColors();
  if (!editable) {
    return (
      <View className="flex-row items-center">
        <Icon name="star" size={size} color={colors.star} />
        {showValue ? (
          <Text
            style={{ fontFamily: fonts.semibold }}
            className="ml-1 text-sm text-primary"
          >
            {formatRating(rating)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable
          key={value}
          onPress={() => onChange?.(value)}
          className="px-1"
          hitSlop={6}
        >
          <Icon
            name={value <= rating ? "star" : "star-border"}
            size={size}
            color={colors.star}
          />
        </Pressable>
      ))}
    </View>
  );
}
