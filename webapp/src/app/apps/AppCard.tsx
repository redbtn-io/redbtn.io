"use client";
/* eslint-disable @next/next/no-img-element -- logos are mixed png/svg/ico
   assets served straight from /public at a fixed tile size. */

import type { AppEntry, AppFlag, AppStatus } from "@/data/apps";

const STATUS_TITLE: Record<AppStatus, string> = {
  up: "Responding",
  down: "Not responding",
  unknown: "Status unknown",
};

const STATUS_DOT: Record<AppStatus, string> = {
  up: "bg-success",
  down: "bg-error",
  unknown: "bg-text-disabled",
};

const FLAG_LABEL: Record<AppFlag, string> = {
  internal: "internal",
  "coming-soon": "coming soon",
  offline: "offline",
};

const FLAG_CLASS: Record<AppFlag, string> = {
  internal: "border-border text-text-muted",
  "coming-soon": "border-accent/40 text-accent-text",
  offline: "border-error/40 text-error",
};

const TILE =
  "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-elevated";

/**
 * redBoard -> { prefix: "red", suffix: "board" }. Only redApp wordmarks get
 * the lowercase brand treatment; partner, site and infra names keep the
 * casing they carry in apps.json.
 */
function splitWordmark(name: string) {
  const match = /^red([A-Z][A-Za-z]*)$/.exec(name);
  return match ? { prefix: "red", suffix: match[1].toLowerCase() } : null;
}

export function hostLabel(url: string | null): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.host}${path}`;
  } catch {
    return url;
  }
}

function GithubMark() {
  return (
    <span className={`${TILE} text-text-primary`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z" />
      </svg>
    </span>
  );
}

function Monogram({ name }: { name: string }) {
  const mark = splitWordmark(name);
  const letter = mark ? mark.suffix[0] : (name[0] ?? "?");
  return (
    <span
      aria-hidden="true"
      className={`${TILE} text-base font-semibold leading-none ${
        mark ? "text-accent-text" : "text-text-secondary"
      }`}
    >
      {letter}
    </span>
  );
}

function Tile({ app }: { app: AppEntry }) {
  if (app.icon === "github") return <GithubMark />;
  if (!app.logo) return <Monogram name={app.name} />;

  return (
    <span className={TILE}>
      <img
        src={app.logo}
        alt={`${app.name} logo`}
        width={28}
        height={28}
        loading="lazy"
        decoding="async"
        className={`h-7 w-7 object-contain ${
          app.logoLight ? "logo-on-light" : ""
        }`}
      />
      {app.logoLight ? (
        <img
          src={app.logoLight}
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          className="logo-on-dark h-7 w-7 object-contain"
        />
      ) : null}
    </span>
  );
}

function Wordmark({ name }: { name: string }) {
  const mark = splitWordmark(name);
  if (!mark) return <span className="text-text-primary">{name}</span>;
  return (
    <span className="lowercase">
      <span className="text-text-primary">{mark.prefix}</span>
      <span className="text-accent-text">{mark.suffix}</span>
    </span>
  );
}

export default function AppCard({
  app,
  status,
}: {
  app: AppEntry;
  status: AppStatus;
}) {
  const host = hostLabel(app.url);
  const isOffline = app.flags.includes("offline");
  const isLink = Boolean(app.url) && !app.flags.includes("coming-soon");
  // A curated offline entry never shows green, whatever its host answers.
  const shown: AppStatus = isOffline ? "down" : status;

  const body = (
    <>
      <div className="flex items-start gap-2">
        <Tile app={app} />
        <span
          role="img"
          title={`${app.name}: ${STATUS_TITLE[shown]}`}
          aria-label={`${app.name}: ${STATUS_TITLE[shown]}`}
          className={`mt-1 ml-auto h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[shown]}`}
        />
      </div>

      <div className="mt-2 min-w-0">
        <div className="truncate text-sm font-semibold leading-tight">
          <Wordmark name={app.name} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-secondary">
          {app.description}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {host ? (
          <span className="max-w-full truncate font-mono text-[10px] text-text-muted">
            {host}
          </span>
        ) : null}
        {app.flags.map((flag) => (
          <span
            key={flag}
            className={`rounded border px-1 py-px font-mono text-[10px] leading-4 ${FLAG_CLASS[flag]}`}
          >
            {FLAG_LABEL[flag]}
          </span>
        ))}
      </div>
    </>
  );

  const base =
    "flex h-full min-w-0 flex-col rounded-xl border border-border bg-bg-elevated p-3 transition-colors";

  if (!isLink) {
    return <div className={`${base} opacity-70`}>{body}</div>;
  }

  return (
    <a
      href={app.url as string}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} hover:border-accent hover:bg-bg-hover focus-visible:border-accent focus-visible:outline-none`}
    >
      {body}
    </a>
  );
}
