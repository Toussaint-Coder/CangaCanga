import { useEffect, useRef } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import {
  getNextSetupStep,
  markOnboardingSeen,
  setupHref,
} from "@/features/setup/setup";
import { fonts } from "@/theme";

/**
 * Shown only on the very first app launch, then continues to permissions.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const marked = useRef(false);

  useEffect(() => {
    void (async () => {
      const step = await getNextSetupStep();
      if (step !== "onboarding") {
        router.replace(setupHref(step) as "/(auth)/permissions");
        return;
      }
      if (!marked.current) {
        marked.current = true;
        await markOnboardingSeen();
      }
    })();
  }, [router]);

  const goNext = () => {
    router.replace("/(auth)/permissions");
  };

  return (
    <View className="flex-1 bg-background">
      <ImageBackground
        source={require("../../assets/onboarding.png")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]}
        />

        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 24),
            paddingHorizontal: 24,
          }}
        >
          <View className="flex-1 justify-end pb-6">
            <Text
              style={{ fontFamily: fonts.bold }}
              className="text-3xl leading-tight text-white"
            >
              {t("onboarding.title")}
            </Text>
            <Text
              style={{ fontFamily: fonts.regular }}
              className="mt-4 text-base leading-6 text-white/90"
            >
              {t("onboarding.subtitle")}
            </Text>
          </View>

          <Button
            label={t("onboarding.cta")}
            onPress={goNext}
            variant="secondary"
          />

          <Pressable onPress={goNext} className="mt-4 items-center py-2">
            <Text
              style={{ fontFamily: fonts.medium }}
              className="text-sm text-white/80"
            >
              {t("onboarding.skip")}
            </Text>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}
