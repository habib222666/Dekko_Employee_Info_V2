const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha1Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const cloudKey = Deno.env.get("CLOUDINARY_API_KEY");
    const cloudSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (
      !supabaseUrl || !supabaseKey || !serviceKey ||
      !cloudName || !cloudKey || !cloudSecret
    ) {
      return json({ error: "Server configuration is incomplete." }, 500);
    }

    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "Please log in first." }, 401);
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: authorization,
      },
    });

    if (!userResponse.ok) {
      return json({ error: "Your session is invalid or expired." }, 401);
    }

    const user = await userResponse.json();
    if (user.id !== "f0fcbd2e-003e-4fc2-bc2e-51b13c5f0814") {
      return json({ error: "Admin access required." }, 403);
    }

    const form = await req.formData();
    const source = String(form.get("source") || "");
    const employeeNo = String(form.get("employeeNo") || "").trim();
    const file = form.get("file");

    if (!["factory", "headoffice"].includes(source)) {
      return json({ error: "Invalid employee source." }, 400);
    }

    if (!/^[A-Za-z0-9_-]{1,50}$/.test(employeeNo)) {
      return json({ error: "Invalid employee number." }, 400);
    }

    if (!(file instanceof File)) {
      return json({ error: "Please select a photo." }, 400);
    }

    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    if (!allowedTypes[file.type]) {
      return json({ error: "Use a JPG, PNG, or WebP image." }, 400);
    }

    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      return json({ error: "Photo size must be 10 MB or less." }, 400);
    }

    const table = source === "factory"
      ? "all_employee_factory"
      : "all_employee_headoffice";

    // Confirm the employee exists before uploading a photo.
    const employeeResponse = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=employee_no&employee_no=eq.${encodeURIComponent(employeeNo)}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    );

    if (!employeeResponse.ok) {
      const verificationError = await employeeResponse.text();
      console.error("Employee verification request failed", {
        table,
        status: employeeResponse.status,
        details: verificationError,
      });
      return json({ error: "Could not verify the employee record." }, 502);
    }

    const employeeRows = await employeeResponse.json();
    if (!Array.isArray(employeeRows) || employeeRows.length === 0) {
      return json({ error: "Employee not found." }, 404);
    }

    const folder = source === "factory"
      ? "employee-photos/factory"
      : "employee-photos/head-office";
    const publicId = employeeNo;
    const timestamp = Math.floor(Date.now() / 1000);

    const signedParams = [
      `folder=${folder}`,
      "overwrite=true",
      `public_id=${publicId}`,
      `timestamp=${timestamp}`,
    ].sort().join("&");

    const signature = await sha1Hex(signedParams + cloudSecret);

    const cloudForm = new FormData();
    cloudForm.append("file", file, file.name);
    cloudForm.append("api_key", cloudKey);
    cloudForm.append("timestamp", String(timestamp));
    cloudForm.append("folder", folder);
    cloudForm.append("public_id", publicId);
    cloudForm.append("overwrite", "true");
    cloudForm.append("signature", signature);

    const cloudResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudForm },
    );

    const cloudResult = await cloudResponse.json();

    if (!cloudResponse.ok || !cloudResult.secure_url) {
      console.error("Cloudinary upload failed:", cloudResult.error?.message);
      return json({ error: "Cloudinary upload failed." }, 502);
    }

    const photoUrl = String(cloudResult.secure_url);
    const validCloudinaryUrl =
      photoUrl.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`);

    if (!validCloudinaryUrl) {
      return json({ error: "Unexpected Cloudinary response." }, 502);
    }

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/${table}?employee_no=eq.${encodeURIComponent(employeeNo)}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ photo_path: photoUrl }),
      },
    );

    if (!updateResponse.ok) {
      console.error("Employee photo database update failed.");
      return json({
        error: "Photo uploaded, but saving its URL failed. Please contact the administrator.",
      }, 502);
    }

    const updatedRows = await updateResponse.json();
    if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
      return json({
        error: "Photo uploaded, but no employee record was updated.",
      }, 502);
    }

    return json({
      success: true,
      photoUrl,
      employeeNo,
      source,
    });
  } catch (error) {
    console.error("Employee photo upload error:", error);
    return json({ error: "Unexpected upload error." }, 500);
  }
});
