"use client";

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

function Monogram({ name }: { name: string }) {
  const mark = splitWordmark(name);
  const letter = mark ? mark.suffix[0] : (name[0] ?? "?");
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-base font-semibold leading-none ${
        mark ? "text-accent-text" : "text-text-secondary"
      }`}
    >
      {letter}
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
        <Monogram name={app.name} />
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
