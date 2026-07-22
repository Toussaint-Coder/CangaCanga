import * as FileSystem from "expo-file-system";

import { env } from "@/config/env";
import { supabase } from "@/services/supabase";

/**
 * Cloudflare R2 uploads.
 *
 * The device never holds the R2 secret key. It asks the `r2-presign` Supabase
 * Edge Function for a short-lived PUT URL, then uploads via expo-file-system
 * (reliable for content:// and file:// URIs on Android).
 */

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export type UploadProgress = (progress: number) => void;

function guessExtension(uri: string, mime?: string | null): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  if (mime?.includes("jpeg") || mime?.includes("jpg")) return "jpg";
  const m = uri.match(/\.(\w+)(?:\?|$)/);
  return (m?.[1] ?? "jpg").toLowerCase();
}

function contentTypeFor(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

/**
 * Copy picker URIs (often `content://` on Android) into the app cache so
 * FileSystem can read/upload them reliably.
 */
export async function cacheLocalImage(
  uri: string,
  mimeType?: string | null,
): Promise<string> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return uri;

  if (uri.startsWith(cacheDir) || uri.startsWith(FileSystem.documentDirectory ?? "")) {
    return uri;
  }

  const ext = guessExtension(uri, mimeType);
  const dest = `${cacheDir}upload-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const binary = globalThis.atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function readImageBytes(
  localUri: string,
  base64?: string | null,
): Promise<ArrayBuffer> {
  if (base64) {
    return base64ToArrayBuffer(base64);
  }

  const fileUri = await cacheLocalImage(localUri);
  const encoded = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64ToArrayBuffer(encoded);
}

function putBytes(
  uploadUrl: string,
  body: ArrayBuffer,
  contentType: string,
  onProgress?: UploadProgress,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(1, event.loaded / event.total));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error(`Upload to R2 failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during image upload."));
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);
    onProgress?.(0.05);
    xhr.send(body);
  });
}

async function putFile(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
  onProgress?: UploadProgress,
): Promise<void> {
  const task = FileSystem.createUploadTask(
    uploadUrl,
    fileUri,
    {
      httpMethod: "PUT",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { "Content-Type": contentType },
    },
    (data) => {
      if (data.totalBytesExpectedToSend > 0) {
        onProgress?.(
          Math.min(1, data.totalBytesSent / data.totalBytesExpectedToSend),
        );
      }
    },
  );

  const result = await task.uploadAsync();
  if (!result || result.status < 200 || result.status >= 300) {
    throw new Error(`Upload to R2 failed (${result?.status ?? "unknown"}).`);
  }
  onProgress?.(1);
}

export interface UploadImageInput {
  localUri: string;
  userId: string;
  folder?: "avatars" | "vehicles";
  mimeType?: string | null;
  base64?: string | null;
  onProgress?: UploadProgress;
}

/**
 * Uploads a local image file to R2 and returns its public URL.
 */
export async function uploadImage(
  input: UploadImageInput | string,
  userId?: string,
  folder: "avatars" | "vehicles" = "avatars",
  mimeType?: string | null,
  onProgress?: UploadProgress,
): Promise<string> {
  const opts: UploadImageInput =
    typeof input === "string"
      ? {
          localUri: input,
          userId: userId!,
          folder,
          mimeType,
          onProgress,
        }
      : input;

  if (!opts.localUri) {
    throw new Error("No image selected.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("You must be signed in to upload images.");
  }

  const ext = guessExtension(opts.localUri, opts.mimeType);
  const contentType = contentTypeFor(ext);
  const key = `${opts.folder ?? "avatars"}/${opts.userId}/${Date.now()}.${ext}`;
  const report = opts.onProgress;

  report?.(0.02);

  const { data, error } = await supabase.functions.invoke<PresignResponse>(
    "r2-presign",
    { body: { key, contentType } },
  );

  if (error) {
    throw new Error(
      `Could not get an upload URL (${error.message}). Is the r2-presign function deployed and are R2 secrets set?`,
    );
  }
  if (!data?.uploadUrl || !data.publicUrl) {
    throw new Error(
      "Could not get an upload URL. Is the r2-presign function deployed?",
    );
  }

  report?.(0.08);

  // Prefer native file upload (handles content:// after caching).
  try {
    const fileUri = await cacheLocalImage(opts.localUri, opts.mimeType);
    report?.(0.12);
    await putFile(data.uploadUrl, fileUri, contentType, (p) => {
      report?.(0.12 + p * 0.88);
    });
    return data.publicUrl;
  } catch {
    // Fall back to reading bytes (base64 or FileSystem) + XHR PUT.
  }

  const bytes = await readImageBytes(opts.localUri, opts.base64);
  report?.(0.15);
  await putBytes(data.uploadUrl, bytes, contentType, (p) => {
    report?.(0.15 + p * 0.85);
  });
  return data.publicUrl;
}

export async function uploadProfilePicture(
  localUri: string,
  userId: string,
  mimeType?: string | null,
  onProgress?: UploadProgress,
  base64?: string | null,
): Promise<string> {
  return uploadImage({
    localUri,
    userId,
    folder: "avatars",
    mimeType,
    base64,
    onProgress,
  });
}

export async function uploadVehiclePicture(
  localUri: string,
  userId: string,
  mimeType?: string | null,
  onProgress?: UploadProgress,
  base64?: string | null,
): Promise<string> {
  return uploadImage({
    localUri,
    userId,
    folder: "vehicles",
    mimeType,
    base64,
    onProgress,
  });
}

export function isR2PublicUrlSet(): boolean {
  return env.r2.publicUrl.length > 0;
}
