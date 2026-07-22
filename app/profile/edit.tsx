import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "@/components/ui/Icon";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useUpdateProfile } from "@/features/profile/profile.hooks";
import { useAuthStore } from "@/stores/authStore";
import { fonts, useThemeColors } from "@/theme";
import {
  formatPhoneDisplay,
  isValidBurundiPhone,
  normalizePhone,
} from "@/utils/phone";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const update = useUpdateProfile();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(
    profile?.phone_number
      ? formatPhoneDisplay(profile.phone_number).replace("+257 ", "")
      : "",
  );
  const [plate, setPlate] = useState(profile?.vehicle_plate_number ?? "");
  const [pictureUri, setPictureUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPictureUri(result.assets[0].uri);
    }
  };

  const onSave = () => {
    setError(null);
    if (fullName.trim().length < 2) {
      setError(t("editProfile.nameError"));
      return;
    }
    if (!isValidBurundiPhone(phone)) {
      setError(t("editProfile.phoneError"));
      return;
    }
    update.mutate(
      {
        fullName,
        phoneNumber: normalizePhone(phone),
        vehiclePlateNumber: plate,
        profilePictureUri: pictureUri ?? undefined,
      },
      {
        onSuccess: () => router.back(),
        onError: (err: any) =>
          setError(err.message ?? t("editProfile.genericError")),
      },
    );
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("editProfile.title")} variant="close" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6 items-center">
            <Pressable onPress={pickImage} className="items-center">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                {pictureUri ? (
                  <Image
                    source={{ uri: pictureUri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                  />
                ) : profile?.profile_picture ? (
                  <Avatar uri={profile.profile_picture} size={96} />
                ) : (
                  <Icon name="photo-camera" size={26} color={colors.muted} />
                )}
              </View>
              <Text className="mt-2 text-sm font-medium text-accent">
                {t("editProfile.changePhoto")}
              </Text>
            </Pressable>
          </View>

          <View className="gap-y-4">
            <Input
              label={t("editProfile.fullName")}
              value={fullName}
              onChangeText={setFullName}
              leftIcon={<Icon name="person" size={18} color={colors.muted} />}
            />
            <Input
              label={t("editProfile.phone")}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={t("auth.login.phonePlaceholder")}
              leftIcon={<Icon name="phone" size={18} color={colors.muted} />}
              helperText={t("editProfile.phoneHint")}
            />
            <Input
              label={t("editProfile.plate")}
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
              leftIcon={
                <Icon name="directions-car" size={18} color={colors.muted} />
              }
            />

            {profile ? (
              <View className="rounded-2xl border border-border bg-card px-4 py-3">
                <Text
                  style={{ fontFamily: fonts.medium }}
                  className="text-xs text-muted"
                >
                  {t("profile.rating")}
                </Text>
                <Text
                  style={{ fontFamily: fonts.semibold }}
                  className="mt-1 text-base text-primary"
                >
                  {(profile.rating ?? 0).toFixed(1)} ·{" "}
                  {t("profile.reviews", { count: profile.rating_count ?? 0 })}
                </Text>
              </View>
            ) : null}

            {error ? <Text className="text-sm text-danger">{error}</Text> : null}

            <Button
              label={t("editProfile.save")}
              onPress={onSave}
              loading={update.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
