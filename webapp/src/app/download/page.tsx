import type { Metadata } from "next";
import Link from "next/link";
import DownloadClient from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download — redbtn",
  description:
    "Download redbtn Desktop for macOS or Windows, or install the redbtn CLI with one command.",
  openGraph: {
    title: "Download — redbtn",
    description:
      "redbtn Desktop for macOS and Windows, and the redbtn CLI for your terminal.",
    url: "https://redbtn.io/download",
  },
};

const DESKTOP_BASE = "https://models.redbtn.io/redbtn-models/desktop/stable";
const CLI_BASE = "https://models.redbtn.io/redbtn-models/cli/stable";
const UA = "redbtn-io-site/1.0";

export interface DesktopAsset {
  name: string;
  url: string;
  size: number;
}

export interface DesktopFeed {
  version: string;
  releaseDate?: string;
  windows?: DesktopAsset;
  macArm64Dmg?: DesktopAsset;
  macX64Dmg?: DesktopAsset;
  macArm64Zip?: DesktopAsset;
  macX64Zip?: DesktopAsset;
}

export interface CliFeed {
  version: string;
  size?: number;
  date?: string;
  notes?: string;
}

/** The exact shape electron-builder writes (top-level version/path/size + files[]). */
function parseFeedYml(text: string, base: string): { version: string; releaseDate?: string; assets: DesktopAsset[] } {
  const top: Record<string, string> = {};
  const assets: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;
  let inFiles = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!line.startsWith(" ") && !line.startsWith("-")) {
      inFiles = false;
      current = null;
      const i = line.indexOf(":");
      if (i === -1) throw new Error("unparsable feed line");
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key === "files") {
        inFiles = true;
        continue;
      }
      top[key] = value;
      continue;
    }
    if (inFiles) {
      let stripped = line.trim();
      if (stripped.startsWith("- ")) {
        current = {};
        assets.push(current);
        stripped = stripped.slice(2);
      }
      if (!current) throw new Error("file entry outside a list item");
      const i = stripped.indexOf(":");
      if (i === -1) throw new Error("unparsable file entry");
      current[stripped.slice(0, i).trim()] = stripped.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
  if (!top.version) throw new Error("feed has no version");
  const out: DesktopAsset[] = assets
    .filter((a) => a.url)
    .map((a) => ({ name: a.url, url: `${base}/${a.url}`, size: Number(a.size) || 0 }));
  // The top-level `path` entry is the primary installer; make sure it leads.
  if (top.path && !out.some((a) => a.name === top.path)) {
    out.unshift({ name: top.path, url: `${base}/${top.path}`, size: Number(top.size) || 0 });
  }
  return { version: top.version, releaseDate: top.releaseDate, assets: out };
}

async function readText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function pick(assets: DesktopAsset[], pred: (name: string) => boolean): DesktopAsset | undefined {
  return assets.find((a) => pred(a.name));
}

export default async function DownloadPage() {
  const [winYml, macYml, cliText] = await Promise.all([
    readText(`${DESKTOP_BASE}/latest.yml`),
    readText(`${DESKTOP_BASE}/latest-mac.yml`),
    readText(`${CLI_BASE}/latest.json`),
  ]);

  let desktop: DesktopFeed | null = null;
  try {
    if (winYml || macYml) {
      const feed: DesktopFeed = { version: "unknown" };
      if (winYml) {
        const w = parseFeedYml(winYml, DESKTOP_BASE);
        feed.version = w.version;
        feed.releaseDate = w.releaseDate;
        const exe = pick(w.assets, (n) => n.endsWith(".exe"));
        if (exe) feed.windows = exe;
      }
      if (macYml) {
        const m = parseFeedYml(macYml, DESKTOP_BASE);
        feed.version = m.version;
        feed.releaseDate = feed.releaseDate ?? m.releaseDate;
        feed.macArm64Dmg = pick(m.assets, (n) => n.includes("arm64") && n.endsWith(".dmg"));
        feed.macX64Dmg = pick(m.assets, (n) => n.includes("x64") && n.endsWith(".dmg"));
        feed.macArm64Zip = pick(m.assets, (n) => n.includes("arm64") && n.endsWith(".zip"));
        feed.macX64Zip = pick(m.assets, (n) => n.includes("x64") && n.endsWith(".zip"));
      }
      desktop = feed;
    }
  } catch {
    desktop = null;
  }

  let cli: CliFeed | null = null;
  try {
    if (cliText) {
      const l = JSON.parse(cliText) as CliFeed;
      if (typeof l.version === "string") cli = l;
    }
  } catch {
    cli = null;
  }

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <Link
          href="/"
          aria-label="Back to redbtn.io"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent shadow-lg transition-transform hover:scale-105"
        >
          <span className="h-4 w-4 rounded-full bg-white/90" />
        </Link>

        <h1 className="mt-6 text-3xl font-bold lowercase tracking-tight sm:text-4xl">
          download <span className="text-accent-text">redbtn</span>
        </h1>
        <p className="mt-2 text-text-muted">
          Desktop for your machine, CLI for your terminal. Nothing else to install.
        </p>

        <DownloadClient desktop={desktop} cli={cli} />
      </div>
    </main>
  );
}
