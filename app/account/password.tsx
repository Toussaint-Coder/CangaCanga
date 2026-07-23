import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { changePassword } from "@/features/account/account.service";
import { fonts } from "@/theme";

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    password.length >= 6 && confirm.length >= 6 && password === confirm;

  const onSave = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t("account.password.tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("account.password.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await changePassword(password);
      Alert.alert(t("account.password.successTitle"), t("account.password.successBody"));
      router.back();
    } catch (err: any) {
      setError(err?.message ?? t("account.password.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("account.password.title")} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{ fontFamily: fonts.regular }}
            className="mb-4 text-sm text-muted"
          >
            {t("account.password.hint")}
          </Text>
          <View className="gap-y-4">
            <Input
              label={t("account.password.new")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label={t("account.password.confirm")}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
            />
            {error ? (
              <Text className="text-sm text-danger">{error}</Text>
            ) : null}
            <Button
              label={t("account.password.save")}
              onPress={onSave}
              loading={loading}
              disabled={!valid || loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
