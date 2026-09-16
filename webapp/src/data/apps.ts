import appsJson from "./apps.json";

export type AppCategory = "redapps" | "partners" | "sites" | "infra";
export type AppFlag = "internal" | "coming-soon" | "offline";
export type AppStatus = "up" | "down" | "unknown";

export type AppEntry = {
  id: string;
  name: string;
  url: string | null;
  description: string;
  category: AppCategory;
  flags: AppFlag[];
  /**
   * HTTP codes this entry is expected to answer with at its URL, for
   * API-only or auth-walled services (redPrint 404, redGuard 401, models
   * 403). Anything listed here counts as up; an unlisted 404 counts as down.
   */
  expect?: number[];
};

/** Single source of truth for the /apps launcher and the status API. */
export const apps = appsJson as unknown as AppEntry[];
