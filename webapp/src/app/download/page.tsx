import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DownloadClient from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download — redbtn",
  description:
    "Download redbtn Desktop for macOS or Windows, install the redbtn CLI with one command, or add the redbtn Browser extension to Chrome.",
  openGraph: {
    title: "Download — redbtn",
    description:
      "redbtn Desktop for macOS and Windows, the redbtn CLI for your terminal, and the redbtn Browser extension for Chrome.",
    url: "https://redbtn.io/download",
  },
};

const DESKTOP_BASE = "https://models.redbtn.io/redbtn-models/desktop/stable";
const CLI_BASE = "https://models.redbtn.io/redbtn-models/cli/stable";
const BROWSER_BASE = "https://models.redbtn.io/redbtn-models/browser/stable";
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

export interface BrowserFeed {
  version: string;
  url: string;
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
  const [winYml, macYml, cliText, browserText] = await Promise.all([
    readText(`${DESKTOP_BASE}/latest.yml`),
    readText(`${DESKTOP_BASE}/latest-mac.yml`),
    readText(`${CLI_BASE}/latest.json`),
    readText(`${BROWSER_BASE}/latest.json`),
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

  let browser: BrowserFeed | null = null;
  try {
    if (browserText) {
      const b = JSON.parse(browserText) as BrowserFeed;
      if (typeof b.version === "string" && typeof b.url === "string") browser = b;
    }
  } catch {
    browser = null;
  }

  return (
    <main className="download-route min-h-screen overflow-x-clip bg-background text-text-primary">
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-10 lg:pb-24 lg:pt-8">
        <header className="flex items-center justify-between gap-6">
          <Link href="/" className="group inline-flex items-center gap-3" aria-label="redbtn home">
            <Image
              src="/redbtn-logo.png"
              alt="redbtn"
              width={56}
              height={56}
              priority
              className="h-12 w-12 drop-shadow-lg transition-transform group-hover:scale-105 sm:h-14 sm:w-14"
            />
            <span className="leading-none">
              <span className="block text-2xl font-bold lowercase tracking-tight">redbtn</span>
              <span className="mt-1 block text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
                downloads
              </span>
            </span>
          </Link>
          <Link
            href="/apps"
            className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-accent hover:text-accent-text sm:inline-flex"
          >
            Explore the apps <span aria-hidden="true">→</span>
          </Link>
        </header>

        <section className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] xl:gap-16">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-text">
              <span className="h-px w-10 bg-accent" aria-hidden="true" />
              Downloads
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-bold lowercase leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl">
              the <span className="text-accent-text">red button</span>, on every surface.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
              Install redbtn where you work: Desktop for your machine, the CLI for your terminal, and
              Browser for Chrome. Each surface connects through the same account, consent, and
              permission model.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {["One redbtn account", "Permissions stay explicit", "Desktop updates itself"].map(
                (item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-elevated/70 px-3.5 py-2 text-sm text-text-muted"
                  >
                    <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-bg-elevated/80 p-7 shadow-2xl backdrop-blur-sm sm:p-9">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
              aria-hidden="true"
            />
            <Image
              src="/redbtn-logo.png"
              alt="The redbtn logo"
              width={208}
              height={208}
              priority
              className="relative mx-auto h-44 w-44 drop-shadow-2xl sm:h-52 sm:w-52"
            />
            <p className="relative mt-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Current releases
            </p>
            <div className="relative mt-4 divide-y divide-border/60 border-y border-border/60">
              {[
                {
                  label: "Desktop",
                  href: "#desktop",
                  value: desktop ? `v${desktop.version}` : "Feed unavailable",
                },
                {
                  label: "CLI",
                  href: "#cli",
                  value: cli ? `v${cli.version}` : "Feed unavailable",
                },
                {
                  label: "Browser",
                  href: "#browser",
                  value: browser ? `v${browser.version}` : "Feed unavailable",
                },
              ].map((release) => (
                <a
                  key={release.label}
                  href={release.href}
                  className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:text-accent-text"
                >
                  <span className="font-semibold">{release.label}</span>
                  <span className="text-text-muted">{release.value} →</span>
                </a>
              ))}
            </div>
            <p className="relative mt-5 text-center text-sm text-text-muted">
              Pick a surface below to install it.
            </p>
          </aside>
        </section>

        <DownloadClient desktop={desktop} cli={cli} browser={browser} />
      </div>
    </main>
  );
}
