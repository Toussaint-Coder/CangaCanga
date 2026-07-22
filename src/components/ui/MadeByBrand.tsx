import { Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

import { fonts } from "@/theme";

/** Small muted brand credit for the bottom of login / profile. */
export function MadeByBrand() {
  const { t } = useTranslation();

  return (
    <View className="items-center py-4" style={{ opacity: 0.4 }}>
      <Text
        style={{ fontFamily: fonts.medium }}
        className="mb-2 text-xs text-primary"
      >
        {t("common.madeBy")}
      </Text>
      <Image
        source={require("../../../assets/Brand.png")}
        style={{ width: 96, height: 28 }}
        contentFit="contain"
      />
    </View>
  );
}
