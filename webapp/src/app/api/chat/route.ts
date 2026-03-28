import { NextRequest, NextResponse } from "next/server";

const REDBTN_API_URL =
  process.env.REDBTN_API_URL || "https://app.redbtn.io";
const SERVICE_TOKEN = process.env.RED_SERVICE_TOKEN || "";
const MAX_RETRIES = 3;

async function callUpstream(body: unknown): Promise<Response> {
  return fetch(`${REDBTN_API_URL}/api/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Proxy chat requests to the redbtn API with server-side auth.
 * Retries up to 3 times on failure.
 */
export async function POST(request: NextRequest) {
  if (!SERVICE_TOKEN) {
    return NextResponse.json(
      { error: { message: "Chat service not configured", type: "server_error", code: "not_configured" } },
      { status: 503 }
    );
  }

  const body = await request.json();
  const payload = { ...body, source: "redbtn.io" };

  let lastError: string = "Unknown error";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await callUpstream(payload);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error(`Chat proxy: non-JSON response (attempt ${attempt}/${MAX_RETRIES}):`, res.status, text.slice(0, 200));
        lastError = "Unexpected response from chat service";
        if (attempt < MAX_RETRIES) continue;
        return NextResponse.json(
          { error: { message: lastError, type: "server_error", code: "bad_response" } },
          { status: 502 }
        );
      }

      if (!res.ok) {
        console.error(`Chat proxy: ${res.status} (attempt ${attempt}/${MAX_RETRIES}):`, data?.error?.message);
        lastError = data?.error?.message || `HTTP ${res.status}`;
        if (res.status >= 500 && attempt < MAX_RETRIES) continue;
        return NextResponse.json(data, { status: res.status });
      }

      // Rewrite the streamUrl to proxy through our own endpoint
      if (data.streamUrl) {
        data.streamUrl = `/api/chat/stream?url=${encodeURIComponent(data.streamUrl)}`;
      }

      return NextResponse.json(data);
    } catch (err) {
      console.error(`Chat proxy error (attempt ${attempt}/${MAX_RETRIES}):`, err);
      lastError = err instanceof Error ? err.message : "Failed to reach chat service";
      if (attempt < MAX_RETRIES) continue;
    }
  }

  return NextResponse.json(
    { error: { message: lastError, type: "server_error", code: "proxy_error" } },
    { status: 502 }
  );
}
