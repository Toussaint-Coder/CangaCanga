import { supabase } from "@/services/supabase";
import type { AppNotification } from "@/types/models";
import type { DevicePlatform } from "@/types/database";

export async function getNotifications(): Promise<AppNotification[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("read", false);

  if (error) return 0;
  return count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllAsRead(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", auth.user.id)
    .eq("read", false);
}

/**
 * Upserts this device's Expo push token so the backend can deliver push
 * notifications while the app is backgrounded or killed. Uses a SECURITY
 * DEFINER RPC so a token can be reclaimed when the same device switches users.
 */
export async function savePushToken(
  token: string,
  platform: DevicePlatform,
): Promise<void> {
  const { error } = await supabase.rpc("upsert_device_token", {
    p_token: token,
    p_platform: platform,
  });

  // Fallback while migration 0007 is not yet applied on the remote project.
  if (error) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw error;
    const { error: upsertError } = await supabase.from("device_tokens").upsert(
      {
        user_id: auth.user.id,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
    if (upsertError) throw upsertError;
  }
}

/** Removes a device token (used on sign-out so pushes stop for this device). */
export async function deletePushToken(token: string): Promise<void> {
  await supabase.from("device_tokens").delete().eq("token", token);
}
