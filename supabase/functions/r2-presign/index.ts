// Supabase Edge Function: r2-presign
// Returns a short-lived presigned PUT URL for Cloudflare R2 so the mobile
// client can upload a profile picture WITHOUT ever holding the R2 secret key.
//
// Deploy:
//   supabase functions deploy r2-presign
// Set secrets (never committed):
//   supabase secrets set R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... \
//     R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... R2_PUBLIC_URL=...
//
// The function runs on Deno, where crypto.subtle exists, so aws4fetch can sign.

import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

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
    // verify_jwt is enabled by default; require an authenticated caller.
    if (!req.headers.get("Authorization")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { key, contentType } = await req.json();
    if (!key || typeof key !== "string") {
      return json({ error: "Missing 'key'" }, 400);
    }

    const accountId = Deno.env.get("R2_ACCOUNT_ID")!;
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const bucket = Deno.env.get("R2_BUCKET_NAME")!;
    const publicUrl = Deno.env.get("R2_PUBLIC_URL")!;

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const objectUrl = `${endpoint}/${bucket}/${key}`;

    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      region: "auto",
      service: "s3",
    });

    // Presigned PUT valid for 5 minutes.
    const signed = await aws.sign(
      `${objectUrl}?X-Amz-Expires=300`,
      {
        method: "PUT",
        headers: contentType ? { "content-type": contentType } : {},
        aws: { signQuery: true },
      },
    );

    return json({
      uploadUrl: signed.url,
      publicUrl: `${publicUrl.replace(/\/$/, "")}/${key}`,
      key,
    });
  } catch (err) {
    return json({ error: String(err?.message ?? err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
