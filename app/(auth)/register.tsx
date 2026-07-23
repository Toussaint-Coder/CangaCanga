import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, useRouter, type Href } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "@/components/ui/Icon";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Typography } from "@/components/ui/Typography";
import {
  buildRegisterSchema,
  type RegisterForm,
} from "@/features/auth/auth.schema";
import { useRegister } from "@/features/auth/auth.hooks";
import { fonts, useThemeColors } from "@/theme";

const href = (path: string) => path as Href;

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const register = useRegister();
  const [pictureUri, setPictureUri] = useState<string | null>(null);
  const [pictureMime, setPictureMime] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Rebuild the schema when the language changes so messages are translated.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schema = useMemo(() => buildRegisterSchema(), [i18n.language]);
  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      password: "",
      vehiclePlateNumber: "",
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPictureUri(result.assets[0].uri);
      setPictureMime(result.assets[0].mimeType ?? null);
      setPictureError(null);
    }
  };

  const onSubmit = (values: RegisterForm) => {
    if (!pictureUri) {
      setPictureError(t("auth.register.pictureRequired"));
      return;
    }
    if (!acceptedTerms) {
      setFormError(t("auth.register.acceptRequired"));
      return;
    }
    setFormError(null);
    setUploadProgress(0);
    register.mutate(
      {
        ...values,
        profilePictureUri: pictureUri,
        profilePictureMime: pictureMime,
        onUploadProgress: setUploadProgress,
      },
      {
        onSuccess: () => router.replace("/(tabs)"),
        onError: (err: any) => {
          setUploadProgress(null);
          setFormError(err.message ?? t("auth.register.genericError"));
        },
        onSettled: () => {
          // Keep 100% briefly then clear if still on screen after success navigation.
          setTimeout(() => setUploadProgress(null), 400);
        },
      },
    );
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
          <View className="mb-6">
            <Typography variant="title">{t("auth.register.title")}</Typography>
            <Typography variant="caption" className="mt-1">
              {t("auth.register.subtitle")}
            </Typography>
          </View>

          {/* Profile picture picker */}
          <View className="mb-6 items-center">
            <Pressable
              onPress={pickImage}
              disabled={register.isPending}
              className="items-center"
            >
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                {pictureUri ? (
                  <Image
                    source={{ uri: pictureUri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                  />
                ) : (
                  <Icon name="photo-camera" size={26} color={colors.muted} />
                )}
                {uploadProgress != null ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/45">
                    <Text
                      style={{ fontFamily: fonts.semibold }}
                      className="text-sm text-white"
                    >
                      {Math.round(uploadProgress * 100)}%
                    </Text>
                    <View className="mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-white/30">
                      <View
                        className="h-full rounded-full bg-white"
                        style={{ width: `${Math.round(uploadProgress * 100)}%` }}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
              <Text className="mt-2 text-sm font-medium text-accent">
                {uploadProgress != null
                  ? t("common.uploading")
                  : pictureUri
                    ? t("auth.register.changePhoto")
                    : t("auth.register.addPhoto")}
              </Text>
            </Pressable>
            {pictureError ? (
              <Text className="mt-1 text-xs text-danger">{pictureError}</Text>
            ) : null}
          </View>

          <View className="gap-y-4">
            <Controller
              control={control}
              name="fullName"
              render={({ field, fieldState }) => (
                <Input
                  label={t("auth.register.fullName")}
                  placeholder={t("auth.register.fullNamePlaceholder")}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  leftIcon={<Icon name="person" size={18} color={colors.muted} />}
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field, fieldState }) => (
                <Input
                  label={t("auth.login.phone")}
                  placeholder={t("auth.login.phonePlaceholder")}
                  keyboardType="phone-pad"
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
                  label={t("auth.register.password")}
                  placeholder={t("auth.register.passwordPlaceholder")}
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

            <Controller
              control={control}
              name="vehiclePlateNumber"
              render={({ field, fieldState }) => (
                <Input
                  label={t("auth.register.plate")}
                  placeholder={t("auth.register.platePlaceholder")}
                  autoCapitalize="characters"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  leftIcon={<Icon name="directions-car" size={18} color={colors.muted} />}
                />
              )}
            />

            {formError ? (
              <Text className="text-sm text-danger">{formError}</Text>
            ) : null}

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              onPress={() => setAcceptedTerms((v) => !v)}
              className="mb-2 flex-row items-start"
            >
              <View
                className="mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded border"
                style={{
                  borderColor: acceptedTerms ? colors.accent : colors.border,
                  backgroundColor: acceptedTerms ? colors.accent : "transparent",
                }}
              >
                {acceptedTerms ? (
                  <Icon name="check" size={14} color={colors.secondary} />
                ) : null}
              </View>
              <Text
                style={{ fontFamily: fonts.regular }}
                className="flex-1 text-sm leading-5 text-muted"
              >
                {t("auth.register.acceptPrefix")}{" "}
                <Text
                  className="text-accent"
                  onPress={() => router.push(href("/legal/terms"))}
                >
                  {t("legal.terms.title")}
                </Text>{" "}
                {t("auth.register.acceptAnd")}{" "}
                <Text
                  className="text-accent"
                  onPress={() => router.push(href("/legal/privacy"))}
                >
                  {t("legal.privacy.title")}
                </Text>
                .
              </Text>
            </Pressable>

            <Button
              label={t("auth.register.submit")}
              onPress={handleSubmit(onSubmit)}
              loading={register.isPending}
              disabled={!acceptedTerms || register.isPending}
            />
          </View>

          <View className="mt-8 flex-row justify-center">
            <Typography variant="caption">
              {t("auth.register.haveAccount")}
            </Typography>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-accent">
                  {t("auth.register.signIn")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
