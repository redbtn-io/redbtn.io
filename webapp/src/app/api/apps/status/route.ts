import { apps, type AppStatus } from "@/data/apps";

export const dynamic = "force-dynamic";

const TTL_MS = 60_000;
const TIMEOUT_MS = 6_000;

let cache: { at: number; data: Record<string, AppStatus> } | null = null;

async function probe(url: string): Promise<AppStatus> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "redbtn-apps-status" },
      cache: "no-store",
    });
    // Anything the origin answers below 500 counts as serving, including
    // redirects and the 401/404 that API-only services return at /.
    return res.status < 500 ? "up" : "down";
  } catch {
    return "down";
  }
}

async function collect(): Promise<Record<string, AppStatus>> {
  const data: Record<string, AppStatus> = {};
  for (const app of apps) data[app.id] = "unknown";

  const probed = apps.filter((app) => Boolean(app.url));
  const results = await Promise.allSettled(
    probed.map((app) => probe(app.url as string)),
  );

  probed.forEach((app, i) => {
    const result = results[i];
    data[app.id] = result.status === "fulfilled" ? result.value : "down";
  });

  return data;
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.at < TTL_MS) {
    return Response.json(cache.data, {
      headers: { "cache-control": "public, max-age=60" },
    });
  }

  try {
    const data = await collect();
    cache = { at: now, data };
    return Response.json(data, {
      headers: { "cache-control": "public, max-age=60" },
    });
  } catch {
    const fallback: Record<string, AppStatus> = {};
    for (const app of apps) fallback[app.id] = "unknown";
    return Response.json(fallback, {
      headers: { "cache-control": "no-store" },
    });
  }
}
