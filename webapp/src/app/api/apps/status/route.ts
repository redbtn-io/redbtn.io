import { apps, type AppEntry, type AppStatus } from "@/data/apps";

export const dynamic = "force-dynamic";

const TTL_MS = 60_000;
const TIMEOUT_MS = 6_000;

let cache: { at: number; data: Record<string, AppStatus> } | null = null;

/**
 * Reachability rules:
 * - a code listed in the entry's `expect` counts as up (API-only or
 *   auth-walled services such as redPrint 404, redGuard 401, models 403)
 * - an unexpected 404 counts as down: the host answers, the app is gone
 * - anything else under 500, redirects included, counts as up
 * - 5xx, network errors and timeouts count as down
 */
function classify(status: number, expect: number[] | undefined): AppStatus {
  if (expect?.includes(status)) return "up";
  if (status === 404) return "down";
  return status < 500 ? "up" : "down";
}

async function probe(app: AppEntry): Promise<AppStatus> {
  try {
    const res = await fetch(app.url as string, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "redbtn-apps-status" },
      cache: "no-store",
    });
    return classify(res.status, app.expect);
  } catch {
    return "down";
  }
}

async function collect(): Promise<Record<string, AppStatus>> {
  const data: Record<string, AppStatus> = {};
  for (const app of apps) data[app.id] = "unknown";

  const probed = apps.filter(
    (app) => Boolean(app.url) && !app.flags.includes("offline"),
  );
  const results = await Promise.allSettled(probed.map((app) => probe(app)));

  probed.forEach((app, i) => {
    const result = results[i];
    data[app.id] = result.status === "fulfilled" ? result.value : "down";
  });

  // A curated offline entry is down whatever its host answers.
  for (const app of apps) {
    if (app.flags.includes("offline")) data[app.id] = "down";
  }

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
    for (const app of apps) {
      fallback[app.id] = app.flags.includes("offline") ? "down" : "unknown";
    }
    return Response.json(fallback, {
      headers: { "cache-control": "no-store" },
    });
  }
}
