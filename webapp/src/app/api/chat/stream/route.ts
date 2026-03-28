import { NextRequest } from "next/server";

const REDBTN_API_URL =
  process.env.REDBTN_API_URL || "https://app.redbtn.io";
const SERVICE_TOKEN = process.env.RED_SERVICE_TOKEN || "";

/**
 * Proxy SSE stream from the redbtn API with server-side auth.
 * The frontend connects to this endpoint; we forward to the real stream.
 */
export async function GET(request: NextRequest) {
  const streamPath = request.nextUrl.searchParams.get("url");

  if (!streamPath || !SERVICE_TOKEN) {
    return new Response("Not configured", { status: 503 });
  }

  const fullUrl = `${REDBTN_API_URL}${streamPath}`;

  try {
    const upstream = await fetch(fullUrl, {
      headers: {
        "Authorization": `Bearer ${SERVICE_TOKEN}`,
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Stream unavailable", { status: upstream.status });
    }

    // Pipe the SSE stream through to the client
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("Stream proxy error:", err);
    return new Response("Stream error", { status: 502 });
  }
}
