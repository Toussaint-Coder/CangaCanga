// Supabase Edge Function: send-push
// Delivers an Expo push notification to every device belonging to the recipient
// of a freshly-created `notifications` row. Invoked by the AFTER INSERT trigger
// `trg_notification_push` (see migration 0005) with `{ record: <notification> }`.
//
// Deploy:
//   supabase functions deploy send-push
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by the
// Edge runtime; no extra secrets are required. The trigger authenticates with
// the service-role key, which satisfies the default verify_jwt check.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Must match the file bundled via the expo-notifications config plugin and the
// Android channel configured on the client.
const SOUND = "notification_sound.wav";
const ANDROID_CHANNEL_ID = "default";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: string;
  channelId: string;
  priority: "high";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const payload = await req.json();
    const record: NotificationRecord | undefined = payload?.record;
    if (!record?.user_id) {
      return json({ error: "Missing notification record" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tokens, error } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", record.user_id);

    if (error) return json({ error: error.message }, 500);
    if (!tokens || tokens.length === 0) {
      return json({ sent: 0, reason: "no device tokens" });
    }

    const messages: ExpoMessage[] = tokens.map(({ token }) => ({
      to: token,
      title: record.title,
      body: record.body,
      data: {
        ...(record.data ?? {}),
        type: record.type,
        notificationId: record.id,
      },
      sound: SOUND,
      channelId: ANDROID_CHANNEL_ID,
      priority: "high",
    }));

    // Expo accepts up to 100 messages per request.
    const results: unknown[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      results.push(await res.json());
    }

    return json({ sent: messages.length, results });
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
