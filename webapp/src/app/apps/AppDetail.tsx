"use client";
/* eslint-disable @next/next/no-img-element -- screenshots are pre-sized
   webp files served straight from /public. */

import { useEffect, useRef } from "react";
import type { AppEntry, AppStatus } from "@/data/apps";
import {
  CATEGORY_LABEL,
  FLAG_CLASS,
  FLAG_LABEL,
  STATUS_DOT,
  STATUS_LABEL,
  Tile,
  Wordmark,
  hostLabel,
  monogramLetter,
  shownStatus,
} from "./parts";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Visual({ app }: { app: AppEntry }) {
  const shot = app.flags.includes("offline") ? null : app.screenshot;

  return (
    <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-background">
      {shot ? (
        <img
          src={shot}
          alt={`${app.name} front page`}
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-5xl font-semibold lowercase text-text-disabled">
            {monogramLetter(app.name)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AppDetail({
  app,
  status,
  onClose,
}: {
  app: AppEntry;
  status: AppStatus;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shown = shownStatus(app, status);
  const host = hostLabel(app.url);
  const comingSoon = app.flags.includes("coming-soon");
  const titleId = `app-detail-${app.id}`;

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep Tab inside the panel while it owns the screen.
      const panel = panelRef.current;
      if (!panel) return;
      const stops = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (stops.length === 0) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      // Hand focus back to the card that opened the panel.
      returnTo?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      role="presentation"
    >
      <div
        className="apps-backdrop absolute inset-0 bg-backdrop/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="apps-sheet relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-border bg-bg-elevated shadow-xl md:max-w-lg md:rounded-2xl"
      >
        {/* Drag handle, phones only */}
        <div className="flex justify-center pt-2 md:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-text-disabled" />
        </div>

        <div className="flex items-start gap-3 px-4 pt-3 pb-3 md:pt-4">
          <Tile app={app} size="lg" />
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="truncate text-lg font-semibold leading-tight"
            >
              <Wordmark name={app.name} />
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded border border-border px-1.5 py-px font-mono text-[10px] leading-4 text-text-muted">
                {CATEGORY_LABEL[app.category]}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[shown]}`}
                  aria-hidden="true"
                />
                {STATUS_LABEL[shown]}
              </span>
              {app.flags.map((flag) => (
                <span
                  key={flag}
                  className={`rounded border px-1.5 py-px font-mono text-[10px] leading-4 ${FLAG_CLASS[flag]}`}
                >
                  {FLAG_LABEL[flag]}
                </span>
              ))}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 cursor-pointer rounded-lg border border-border p-2 text-text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <Visual app={app} />

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {app.details}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {app.highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-border bg-background px-2 py-1 text-xs text-text-secondary"
              >
                {highlight}
              </span>
            ))}
          </div>

          {host ? (
            <p className="mt-3 truncate font-mono text-[11px] text-text-muted">
              {host}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {comingSoon || !app.url ? (
              <button
                type="button"
                disabled
                className="flex-1 cursor-default rounded-lg border border-border bg-background px-4 py-2.5 text-center text-sm font-medium text-text-disabled"
              >
                Coming soon
              </button>
            ) : (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Open {app.name}
              </a>
            )}
            {app.repo ? (
              <a
                href={`https://github.com/${app.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
              >
                GitHub
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
