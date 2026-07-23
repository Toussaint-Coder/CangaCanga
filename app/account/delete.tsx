import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Typography } from "@/components/ui/Typography";
import { deleteMyAccount } from "@/features/account/account.service";
import { useAuthStore } from "@/stores/authStore";
import { fonts, useThemeColors } from "@/theme";

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDelete = () => {
    Alert.alert(
      t("account.delete.finalTitle"),
      t("account.delete.finalMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("account.delete.confirmAction"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteMyAccount();
              await signOut();
              router.replace("/(auth)/login");
            } catch (err: any) {
              Alert.alert(
                t("account.delete.errorTitle"),
                err?.message ?? t("account.delete.errorMessage"),
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("account.delete.title")} />
      <View className="flex-1 px-5 pb-6">
        <Typography variant="heading" className="mb-2">
          {t("account.delete.headline")}
        </Typography>
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mb-4 text-sm leading-5 text-muted"
        >
          {t("account.delete.body")}
        </Text>

        <Card className="mb-3">
          <Text
            style={{ fontFamily: fonts.semibold }}
            className="mb-2 text-sm text-primary"
          >
            {t("account.delete.willDeleteTitle")}
          </Text>
          <Bullet text={t("account.delete.willDeleteProfile")} />
          <Bullet text={t("account.delete.willDeleteRides")} />
          <Bullet text={t("account.delete.willDeleteTokens")} />
        </Card>

        <Card className="mb-6">
          <Text
            style={{ fontFamily: fonts.semibold }}
            className="mb-2 text-sm text-primary"
          >
            {t("account.delete.retainedTitle")}
          </Text>
          <Bullet text={t("account.delete.retainedBody")} />
        </Card>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          onPress={() => setConfirmed((v) => !v)}
          className="mb-6 min-h-[48px] flex-row items-start"
        >
          <View
            className="mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded border"
            style={{
              borderColor: confirmed ? colors.accent : colors.border,
              backgroundColor: confirmed ? colors.accent : "transparent",
            }}
          >
            {confirmed ? (
              <Icon name="check" size={14} color={colors.secondary} />
            ) : null}
          </View>
          <Text
            style={{ fontFamily: fonts.regular }}
            className="flex-1 text-sm text-primary"
          >
            {t("account.delete.checkbox")}
          </Text>
        </Pressable>

        <Button
          label={t("account.delete.confirmAction")}
          variant="danger"
          disabled={!confirmed}
          loading={loading}
          onPress={onDelete}
        />
      </View>
    </Screen>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <Text
      style={{ fontFamily: fonts.regular }}
      className="mb-1.5 text-sm leading-5 text-muted"
    >
      • {text}
    </Text>
  );
}
