"use client";

import type { AppEntry, AppStatus } from "@/data/apps";
import {
  STATUS_DOT,
  STATUS_TITLE,
  Visual,
  Wordmark,
  shownStatus,
} from "./parts";

/**
 * A featured entry: the same button, the same `onOpen`, the same panel as a
 * grid card, only bigger and led by the artwork.
 */
export default function FeaturedCard({
  app,
  status,
  onOpen,
}: {
  app: AppEntry;
  status: AppStatus;
  onOpen: (id: string) => void;
}) {
  const shown = shownStatus(app, status);

  return (
    <button
      type="button"
      onClick={() => onOpen(app.id)}
      aria-haspopup="dialog"
      aria-label={`${app.name}. ${app.description} Open details.`}
      className="apps-featured-card flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-bg-elevated text-left transition-colors hover:border-accent hover:bg-bg-hover focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Visual app={app} className="border-b border-border" />

      <div className="flex w-full min-w-0 flex-1 flex-col p-3">
        <div className="flex w-full items-start gap-2">
          <span className="min-w-0 truncate text-base font-semibold leading-tight">
            <Wordmark name={app.name} />
          </span>
          <span
            role="img"
            title={`${app.name}: ${STATUS_TITLE[shown]}`}
            aria-label={`${app.name}: ${STATUS_TITLE[shown]}`}
            className={`mt-1.5 ml-auto h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[shown]}`}
          />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-secondary">
          {app.description}
        </p>
      </div>
    </button>
  );
}
