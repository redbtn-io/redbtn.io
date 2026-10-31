"use client";

import { useEffect, useMemo, useState } from "react";
import type { BrowserFeed, CliFeed, DesktopAsset, DesktopFeed } from "./page";

const CURL_CMD = "curl -fsSL https://redbtn.io/install.sh | sh";
const PS_CMD = "irm https://redbtn.io/install.ps1 | iex";

function mb(size?: number): string {
  if (!size) return "";
  return `${Math.round(size / 1048576)} MB`;
}

function kb(size?: number): string {
  if (!size) return "";
  if (size < 1048576) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${Math.round(size / 1048576)} MB`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent-text"
      aria-label={`Copy ${label}`}
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}

type OS = "mac-arm" | "mac-intel" | "windows" | "other";

function detectOS(): OS {
  const ua = navigator.userAgent;
  const platform = (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform ?? navigator.platform;
  if (/Win/i.test(ua)) return "windows";
  if (/Mac/i.test(ua) || /Mac/i.test(platform)) {
    if (/Intel/i.test(ua) && !/Apple/i.test(ua)) return "mac-intel";
    return "mac-arm";
  }
  return "other";
}

export default function DownloadClient({
  desktop,
  cli,
  browser,
}: {
  desktop: DesktopFeed | null;
  cli: CliFeed | null;
  browser: BrowserFeed | null;
}) {
  const [os, setOs] = useState<OS>("other");
  useEffect(() => setOs(detectOS()), []);

  const primary: { label: string; asset?: DesktopAsset } = useMemo(() => {
    if (!desktop) return { label: "" };
    if (os === "windows" && desktop.windows) return { label: "for Windows", asset: desktop.windows };
    if (os === "mac-intel" && desktop.macX64Dmg) return { label: "for macOS (Intel)", asset: desktop.macX64Dmg };
    if (desktop.macArm64Dmg) return { label: "for macOS (Apple Silicon)", asset: desktop.macArm64Dmg };
    if (desktop.windows) return { label: "for Windows", asset: desktop.windows };
    return { label: "" };
  }, [desktop, os]);

  const others: { label: string; asset: DesktopAsset }[] = useMemo(() => {
    if (!desktop) return [];
    const seen = new Set(primary.asset ? [primary.asset.url] : []);
    const list: { label: string; asset: DesktopAsset }[] = [];
    const add = (label: string, asset?: DesktopAsset) => {
      if (asset && !seen.has(asset.url)) {
        seen.add(asset.url);
        list.push({ label, asset });
      }
    };
    add("macOS Apple Silicon (.dmg)", desktop.macArm64Dmg);
    add("macOS Intel (.dmg)", desktop.macX64Dmg);
    add("macOS Apple Silicon (.zip)", desktop.macArm64Zip);
    add("macOS Intel (.zip)", desktop.macX64Zip);
    add("Windows (.exe)", desktop.windows);
    return list;
  }, [desktop, primary]);

  return (
    <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {/* ---------------- Desktop ---------------- */}
      <section id="desktop" className="flex h-full scroll-mt-8 flex-col rounded-[1.75rem] border border-border/60 bg-bg-elevated/80 p-6 shadow-lg backdrop-blur-sm sm:p-7">
        <h2 className="text-xl font-semibold lowercase">redbtn Desktop</h2>
        <p className="mt-1 text-sm text-text-muted">
          The Red button for your machine: talk to Red, drive apps, keep this machine connected.
        </p>

        {desktop && primary.asset ? (
          <div className="mt-5">
            <a
              href={primary.asset.url}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
            >
              download {primary.label} · v{desktop.version} {mb(primary.asset.size) && `(${mb(primary.asset.size)})`}
            </a>
            {others.length > 0 && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-text-muted hover:text-accent-text">
                  other platforms
                </summary>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {others.map(({ label, asset }) => (
                    <li key={asset.url}>
                      <a href={asset.url} className="text-accent-text hover:underline">
                        {label}
                      </a>{" "}
                      <span className="text-text-muted">
                        v{desktop.version} {mb(asset.size) && `· ${mb(asset.size)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm text-text-muted">
            {desktop === null
              ? "The Desktop feed is unreachable right now — try again in a bit."
              : "No Desktop installer is published for your platform yet."}
          </p>
        )}

        <div className="min-h-5 flex-1" aria-hidden="true" />
        <div className="rounded-xl border border-border/60 bg-background p-4 text-sm text-text-muted">
          <p className="font-semibold text-text-primary">first-run notes (unsigned builds)</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              macOS: open the app, then System Settings → Privacy &amp; Security →{" "}
              <span className="text-text-primary">Open Anyway</span>.
            </li>
            <li>
              Windows: SmartScreen appears → <span className="text-text-primary">More info → Run anyway</span>.
            </li>
            <li>Desktop updates itself — you never reinstall it.</li>
          </ul>
        </div>
      </section>

      {/* ---------------- CLI ---------------- */}
      <section id="cli" className="flex h-full scroll-mt-8 flex-col rounded-[1.75rem] border border-border/60 bg-bg-elevated/80 p-6 shadow-lg backdrop-blur-sm sm:p-7">
        <h2 className="text-xl font-semibold lowercase">redbtn CLI</h2>
        <p className="mt-1 text-sm text-text-muted">
          Run redbtn graphs from your terminal, on any machine with node 20+.{" "}
          {cli && (
            <span>
              Current version: <span className="text-text-primary">v{cli.version}</span>
              {cli.date && ` (${cli.date})`} — update any time with{" "}
              <code className="rounded bg-background px-1.5 py-0.5 text-[13px] text-accent-text">redbtn update</code>.
            </span>
          )}
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-text-muted">macOS / Linux</p>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-3">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm text-text-primary">
                {CURL_CMD}
              </code>
              <CopyButton text={CURL_CMD} label="the install command" />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-text-muted">Windows PowerShell</p>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-3">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm text-text-primary">
                {PS_CMD}
              </code>
              <CopyButton text={PS_CMD} label="the PowerShell install command" />
            </div>
          </div>
        </div>

        <div className="min-h-5 flex-1" aria-hidden="true" />
        <p className="text-sm text-text-muted">
          Then: <code className="rounded bg-background px-1.5 py-0.5 text-[13px] text-text-primary">redbtn login</code>, then{" "}
          <code className="rounded bg-background px-1.5 py-0.5 text-[13px] text-text-primary">redbtn connect</code>.
          Alpha builds: <code className="rounded bg-background px-1.5 py-0.5 text-[13px] text-text-primary">--channel alpha</code>.
        </p>
      </section>

      {/* ---------------- Browser ---------------- */}
      <section id="browser" className="flex h-full scroll-mt-8 flex-col rounded-[1.75rem] border border-border/60 bg-bg-elevated/80 p-6 shadow-lg backdrop-blur-sm sm:p-7">
        <h2 className="text-xl font-semibold lowercase">redbtn Browser</h2>
        <p className="mt-1 text-sm text-text-muted">
          The third connector: let your agents see and drive this Chrome profile — tabs, pages, clicks and
          typing — under the same consent + permission model as Desktop.{" "}
          {browser && (
            <span>
              Current version: <span className="text-text-primary">v{browser.version}</span>
              {browser.date && ` (${browser.date})`}.
            </span>
          )}
        </p>

        {browser ? (
          <div className="mt-5">
            <a
              href={browser.url}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
            >
              download for Chrome · v{browser.version} {kb(browser.size) && `(${kb(browser.size)})`}
            </a>
          </div>
        ) : (
          <p className="mt-5 text-sm text-text-muted">
            The Browser feed is unreachable right now — try again in a bit.
          </p>
        )}

        <div className="min-h-5 flex-1" aria-hidden="true" />
        <div className="rounded-xl border border-border/60 bg-background p-4 text-sm text-text-muted">
          <p className="font-semibold text-text-primary">install (developer mode — not on the Chrome Web Store yet)</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>Unzip the download.</li>
            <li>
              Open <span className="text-text-primary">chrome://extensions</span> and turn on{" "}
              <span className="text-text-primary">Developer mode</span> (top right).
            </li>
            <li>
              <span className="text-text-primary">Load unpacked</span> → choose the unzipped folder.
            </li>
            <li>Click the redbtn button in the toolbar and Connect — approve the device sign-in.</li>
          </ul>
        </div>
      </section>

      {/* ---------------- versions ---------------- */}
      {(desktop?.releaseDate || cli?.notes || browser) && (
        <section className="rounded-[1.75rem] border border-border/60 bg-bg-elevated/80 p-6 text-sm text-text-muted shadow-lg backdrop-blur-sm sm:p-7 lg:col-span-2 xl:col-span-3">
          <h2 className="text-xl font-semibold lowercase text-text-primary">current versions</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {desktop && (
              <li className="rounded-xl bg-background p-4">
                <span className="block font-semibold text-text-primary">Desktop</span>
                <span>
                  v{desktop.version}
                  {desktop.releaseDate && ` · released ${desktop.releaseDate.slice(0, 10)}`}
                </span>
              </li>
            )}
            {cli && (
              <li className="rounded-xl bg-background p-4">
                <span className="block font-semibold text-text-primary">CLI</span>
                <span>
                  v{cli.version}
                  {cli.date && ` · ${cli.date}`}
                  {cli.notes && ` — ${cli.notes}`}
                </span>
              </li>
            )}
            {browser && (
              <li className="rounded-xl bg-background p-4">
                <span className="block font-semibold text-text-primary">Browser</span>
                <span>
                  v{browser.version}
                  {browser.date && ` · ${browser.date}`}
                </span>
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
