import { supabase } from "@/services/supabase";
import { env } from "@/config/env";

/** Deletes the signed-in account via the delete-account Edge Function. */
export async function deleteMyAccount(): Promise<void> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${env.supabase.url}/functions/v1/delete-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      apikey: env.supabase.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string })?.error ??
        `Account deletion failed (${res.status})`,
    );
  }
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Builds a JSON export of the signed-in user's personal data. */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const userId = auth.user.id;

  const [profile, rides, reservations, notifications, reviews] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("rides").select("*").eq("driver_id", userId),
      supabase.from("reservations").select("*").eq("passenger_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId),
      supabase
        .from("reviews")
        .select("*")
        .or(`author_id.eq.${userId},receiver_id.eq.${userId}`),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile.data,
    ridesDriven: rides.data ?? [],
    reservations: reservations.data ?? [],
    notifications: notifications.data ?? [],
    reviews: reviews.data ?? [],
  };
}
