"use client";

import type { AppEntry, AppStatus } from "@/data/apps";
import {
  FLAG_CLASS,
  FLAG_LABEL,
  STATUS_DOT,
  STATUS_TITLE,
  Tile,
  Wordmark,
  hostLabel,
  shownStatus,
} from "./parts";

export default function AppCard({
  app,
  status,
  onOpen,
}: {
  app: AppEntry;
  status: AppStatus;
  onOpen: (id: string) => void;
}) {
  const host = hostLabel(app.url);
  const shown = shownStatus(app, status);

  return (
    <button
      type="button"
      onClick={() => onOpen(app.id)}
      aria-haspopup="dialog"
      aria-label={`${app.name}. ${app.description} Open details.`}
      className="flex h-full min-w-0 cursor-pointer flex-col rounded-xl border border-border bg-bg-elevated p-3 text-left transition-colors hover:border-accent hover:bg-bg-hover focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex w-full items-start gap-2">
        <Tile app={app} />
        <span
          role="img"
          title={`${app.name}: ${STATUS_TITLE[shown]}`}
          aria-label={`${app.name}: ${STATUS_TITLE[shown]}`}
          className={`mt-1 ml-auto h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[shown]}`}
        />
      </div>

      <div className="mt-2 w-full min-w-0">
        <div className="truncate text-sm font-semibold leading-tight">
          <Wordmark name={app.name} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-secondary">
          {app.description}
        </p>
      </div>

      <div className="mt-2 flex w-full flex-wrap items-center gap-1">
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
    </button>
  );
}
