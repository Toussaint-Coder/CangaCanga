import { Alert, Linking } from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import i18n from "@/i18n";

export interface PickedImage {
  uri: string;
  mimeType: string | null;
}

export type ImageSource = "camera" | "library";

async function ensurePermission(source: ImageSource): Promise<boolean> {
  if (source === "camera") {
    const current = await ImagePicker.getCameraPermissionsAsync();
    let status = current.status;
    if (status !== "granted") {
      const asked = await ImagePicker.requestCameraPermissionsAsync();
      status = asked.status;
    }
    if (status !== "granted") {
      Alert.alert(
        i18n.t("media.permissionTitle"),
        i18n.t("media.cameraPermission"),
        [
          { text: i18n.t("common.cancel"), style: "cancel" },
          {
            text: i18n.t("media.openSettings"),
            onPress: () => void Linking.openSettings(),
          },
        ],
      );
      return false;
    }
    return true;
  }

  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") {
    Alert.alert(
      i18n.t("media.permissionTitle"),
      i18n.t("media.photosPermission"),
      [
        { text: i18n.t("common.cancel"), style: "cancel" },
        {
          text: i18n.t("media.openSettings"),
          onPress: () => void Linking.openSettings(),
        },
      ],
    );
    return false;
  }
  return true;
}

function extensionFor(uri: string, mime?: string | null): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  const m = uri.match(/\.(\w+)(?:\?|$)/);
  return (m?.[1] ?? "jpg").toLowerCase();
}

/** Copy picker result into app cache (stable file:// for upload). */
async function toCacheUri(
  uri: string,
  mimeType?: string | null,
): Promise<string> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return uri;
  if (uri.startsWith(cacheDir)) return uri;

  const ext = extensionFor(uri, mimeType);
  const dest = `${cacheDir}picked-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

/**
 * Launch camera or library and return a cached local file URI.
 */
export async function pickImage(
  source: ImageSource,
): Promise<PickedImage | null> {
  try {
    const ok = await ensurePermission(source);
    if (!ok) return null;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      // Avoid huge base64 payloads in JS memory; upload reads the file instead.
      base64: false,
      exif: false,
    };

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const uri = await toCacheUri(asset.uri, mimeType);

    return { uri, mimeType };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : i18n.t("media.pickFailed");
    Alert.alert(i18n.t("media.permissionTitle"), message);
    return null;
  }
}
