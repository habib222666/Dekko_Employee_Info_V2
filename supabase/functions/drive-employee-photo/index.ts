import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function base64url(value: string | Uint8Array): string {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : value;

  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getGoogleAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri?: string;
}) {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({
    alg: "RS256",
    typ: "JWT",
  }));

  const payload = base64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: serviceAccount.token_uri ||
      "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const unsignedToken = `${header}.${payload}`;

  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const keyBytes = Uint8Array.from(
    atob(pem),
    (character) => character.charCodeAt(0),
  );

  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    new TextEncoder().encode(unsignedToken),
  );

  const assertion =
    `${unsignedToken}.${base64url(new Uint8Array(signature))}`;

  const tokenResponse = await fetch(
    serviceAccount.token_uri ||
      "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
  );

  if (!tokenResponse.ok) {
    throw new Error("Google authentication failed");
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error("Google access token unavailable");
  }

  return tokenData.access_token as string;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "GET") {
    return jsonError("Method not allowed", 405);
  }

  const employeeNo = new URL(request.url)
    .searchParams.get("employee_no")?.trim() ?? "";

  if (!/^[A-Za-z0-9_-]{1,40}$/.test(employeeNo)) {
    return jsonError("Invalid employee number", 400);
  }

  const folderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");
  const serviceAccountText =
    Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

  if (!folderId || !serviceAccountText) {
    return jsonError("Photo service is not configured", 503);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountText);

    if (
      serviceAccount.type !== "service_account" ||
      !serviceAccount.client_email ||
      !serviceAccount.private_key
    ) {
      return jsonError("Invalid server configuration", 503);
    }

    const accessToken = await getGoogleAccessToken(serviceAccount);
    const filename = `${employeeNo}.jpg`;

    const query =
      `'${folderId}' in parents and name = '${filename}' and trashed = false`;

    const listUrl = new URL(
      "https://www.googleapis.com/drive/v3/files",
    );

    listUrl.searchParams.set("q", query);
    listUrl.searchParams.set("pageSize", "2");
    listUrl.searchParams.set("fields", "files(id,name,mimeType,size)");
    listUrl.searchParams.set("supportsAllDrives", "true");
    listUrl.searchParams.set("includeItemsFromAllDrives", "true");

    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
      throw new Error("Google Drive lookup failed");
    }

    const listData = await listResponse.json();
    const files = listData.files ?? [];

    if (files.length !== 1) {
      return jsonError("Photo not found", 404);
    }

    const file = files[0];

    if (
      file.name !== filename ||
      file.mimeType !== "image/jpeg" ||
      (file.size && Number(file.size) > 10 * 1024 * 1024)
    ) {
      return jsonError("Invalid photo file", 415);
    }

    const imageResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!imageResponse.ok) {
      throw new Error("Google Drive download failed");
    }

    const image = await imageResponse.arrayBuffer();

    if (image.byteLength === 0 || image.byteLength > 10 * 1024 * 1024) {
      return jsonError("Invalid photo size", 415);
    }

    return new Response(image, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Employee photo request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonError("Unable to load employee photo", 502);
  }
});
