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
  /** Two or three short sentences for the detail panel. */
  details: string;
  /** Three to five chips for the detail panel. */
  highlights: string[];
  /**
   * HTTP codes this entry is expected to answer with at its URL, for
   * API-only or auth-walled services (redPrint 404, redGuard 401, models
   * 403). Anything listed here counts as up; an unlisted 404 counts as down.
   */
  expect?: number[];
  /** Path under /public. Falls back to a monogram tile when absent. */
  logo?: string;
  /** Light-coloured variant of `logo`, used in dark mode. */
  logoLight?: string;
  /** Named inline SVG mark, for brands we draw ourselves. */
  icon?: "github";
  /**
   * Front-page capture under /public/shots, written by
   * scripts/shots/capture.mjs. Absent when the entry is offline or does not
   * serve a page we can shoot; the panel falls back to the monogram.
   */
  screenshot?: string;
  /** owner/name of a PUBLIC GitHub repo. Never set for a private one. */
  repo?: string;
};

/** Single source of truth for the /apps launcher and the status API. */
export const apps = appsJson as unknown as AppEntry[];
