import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { LANGUAGES, setLanguage, type LanguageCode } from "@/i18n";
import { markLanguageSetupSeen } from "@/features/setup/setup";
import { fonts, useThemeColors } from "@/theme";

/**
 * First-launch language picker — screen chrome always in French.
 */
export default function LanguageSetupScreen() {
  const { i18n } = useTranslation();
  const t = i18n.getFixedT("fr");
  const colors = useThemeColors();
  const router = useRouter();
  const [selected, setSelected] = useState<LanguageCode>(
    (LANGUAGES.some((l) => l.code === i18n.language)
      ? i18n.language
      : "rn") as LanguageCode,
  );

  const finish = async () => {
    await setLanguage(selected);
    await markLanguageSetupSeen(selected);
    router.replace("/(auth)/login");
  };

  return (
    <Screen edges={["top", "bottom"]} padded>
      <View className="flex-1 px-1 pt-4">
        <Text
          style={{ fontFamily: fonts.bold }}
          className="text-3xl text-primary"
        >
          {t("setup.language.title")}
        </Text>
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-3 text-base leading-6 text-muted"
        >
          {t("setup.language.subtitle")}
        </Text>

        <Card padded={false} className="mt-8 overflow-hidden">
          {LANGUAGES.map((lang, index) => {
            const active = selected === lang.code;
            return (
              <View key={lang.code}>
                {index > 0 ? <View className="h-px bg-border" /> : null}
                <Pressable
                  onPress={() => setSelected(lang.code)}
                  className="flex-row items-center px-4 py-4"
                >
                  <Icon name="language" size={20} color={colors.muted} />
                  <Text
                    style={{ fontFamily: fonts.medium }}
                    className="ml-3 flex-1 text-base text-primary"
                  >
                    {lang.label}
                  </Text>
                  {active ? (
                    <Icon name="check" size={20} color={colors.accent} />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </Card>

        <View className="mt-auto pb-2 pt-8">
          <Button
            label={t("setup.language.continue")}
            onPress={() => void finish()}
          />
        </View>
      </View>
    </Screen>
  );
}
