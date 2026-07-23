// Supabase Edge Function: delete-account
 // Permanently deletes the authenticated user's account and associated data.
 // Deploy: supabase functions deploy delete-account
 //
 // Requires service role (injected). Caller must send a valid user JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Resolve the caller from their JWT.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Best-effort cleanup of storage objects referenced on the profile.
    const { data: profile } = await admin
      .from("profiles")
      .select("profile_picture")
      .eq("id", userId)
      .maybeSingle();

    // Cancel open rides owned by the user so passengers are notified by triggers.
    await admin
      .from("rides")
      .update({ status: "cancelled" })
      .eq("driver_id", userId)
      .in("status", ["open", "full"]);

    // Cancel the user's pending/accepted reservations.
    await admin
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("passenger_id", userId)
      .in("status", ["pending", "accepted"]);

    // Remove device tokens and in-app notifications.
    await admin.from("device_tokens").delete().eq("user_id", userId);
    await admin.from("notifications").delete().eq("user_id", userId);

    // Deleting auth.users cascades to profiles (ON DELETE CASCADE).
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return json({ error: deleteError.message }, 500);
    }

    return json({
      ok: true,
      retained:
        "Completed trip and review records may be retained in anonymized or legally required form for safety and accounting.",
      profilePicture: profile?.profile_picture ?? null,
    });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
