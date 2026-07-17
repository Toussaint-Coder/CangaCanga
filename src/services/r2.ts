import { env } from "@/config/env";
import { supabase } from "@/services/supabase";

/**
 * Cloudflare R2 uploads for profile pictures.
 *
 * The device never holds the R2 secret key. Instead it asks the `r2-presign`
 * Supabase Edge Function for a short-lived presigned PUT URL, then uploads the
 * bytes directly to R2 and returns the public URL to store on the profile.
 */

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

function guessExtension(uri: string, mime?: string): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
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
 * Uploads a local image file to R2 and returns its public URL.
 * @param localUri  file:// URI from expo-image-picker
 * @param userId    used to namespace the object key
 */
export async function uploadProfilePicture(
  localUri: string,
  userId: string,
): Promise<string> {
  const ext = guessExtension(localUri);
  const contentType = contentTypeFor(ext);
  const key = `avatars/${userId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.functions.invoke<PresignResponse>(
    "r2-presign",
    { body: { key, contentType } },
  );

  if (error || !data?.uploadUrl) {
    throw new Error(
      `Could not get an upload URL. Is the r2-presign function deployed? ${
        error?.message ?? ""
      }`,
    );
  }

  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();

  const putRes = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!putRes.ok) {
    throw new Error(`Upload to R2 failed (${putRes.status}).`);
  }

  return data.publicUrl;
}

/** Whether the client at least knows the public bucket URL for display. */
export function isR2PublicUrlSet(): boolean {
  return env.r2.publicUrl.length > 0;
}
