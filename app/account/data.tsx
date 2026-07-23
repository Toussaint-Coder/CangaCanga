import { useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { exportMyData } from "@/features/account/account.service";
import { fonts } from "@/theme";

export default function DownloadDataScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const onExport = async () => {
    setLoading(true);
    try {
      const payload = await exportMyData();
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: t("account.data.shareTitle"),
      });
    } catch (err: any) {
      Alert.alert(
        t("account.data.errorTitle"),
        err?.message ?? t("account.data.errorMessage"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("account.data.title")} />
      <View className="px-5">
        <Card className="mb-4">
          <Text
            style={{ fontFamily: fonts.regular }}
            className="text-sm leading-5 text-muted"
          >
            {t("account.data.body")}
          </Text>
        </Card>
        <Button
          label={t("account.data.export")}
          onPress={onExport}
          loading={loading}
        />
      </View>
    </Screen>
  );
}
