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
};

/** Single source of truth for the /apps launcher and the status API. */
export const apps = appsJson as unknown as AppEntry[];
