import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { MadeByBrand } from "@/components/ui/MadeByBrand";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import { buildLoginSchema, type LoginForm } from "@/features/auth/auth.schema";
import { useLogin } from "@/features/auth/auth.hooks";
import { useThemeColors } from "@/theme";

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Rebuild the schema when the language changes so messages are translated.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schema = useMemo(() => buildLoginSchema(), [i18n.language]);
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: "", password: "" },
  });

  const onSubmit = (values: LoginForm) => {
    setFormError(null);
    login.mutate(values, {
      onError: (err: any) =>
        setFormError(err.message ?? t("auth.genericError")),
    });
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 mt-10">
            <Typography variant="title">{t("auth.login.title")}</Typography>
            <Typography variant="caption" className="mt-1">
              {t("auth.login.subtitle")}
            </Typography>
          </View>

          <View className="gap-y-4">
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field, fieldState }) => (
                <Input
                  label={t("auth.login.phone")}
                  placeholder={t("auth.login.phonePlaceholder")}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  leftIcon={<Icon name="phone" size={18} color={colors.muted} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Input
                  label={t("auth.login.password")}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  secureTextEntry={!showPassword}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  leftIcon={<Icon name="lock" size={18} color={colors.muted} />}
                  rightElement={
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                    >
                      <Icon
                        name={showPassword ? "visibility-off" : "visibility"}
                        size={18}
                        color={colors.muted}
                      />
                    </Pressable>
                  }
                />
              )}
            />

            {formError ? (
              <Text className="text-sm text-danger">{formError}</Text>
            ) : null}

            <Button
              label={t("auth.login.signIn")}
              onPress={handleSubmit(onSubmit)}
              loading={login.isPending}
              disabled={!formState.isValid && formState.isSubmitted}
            />
          </View>

          <View className="mt-8 flex-row justify-center">
            <Typography variant="caption">{t("auth.login.noAccount")}</Typography>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-accent">
                  {t("auth.login.createOne")}
                </Text>
              </Pressable>
            </Link>
          </View>

          <View className="mt-auto pt-10">
            <MadeByBrand />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
