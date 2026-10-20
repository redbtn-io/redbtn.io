"use client";
/* eslint-disable @next/next/no-img-element -- logos are mixed png/svg/ico
   assets served straight from /public at a fixed tile size. */

import { useState } from "react";
import type { AppCategory, AppEntry, AppFlag, AppStatus } from "@/data/apps";

export const STATUS_LABEL: Record<AppStatus, string> = {
  up: "Up",
  down: "Down",
  unknown: "Unknown",
};

export const STATUS_TITLE: Record<AppStatus, string> = {
  up: "Responding",
  down: "Not responding",
  unknown: "Status unknown",
};

export const STATUS_DOT: Record<AppStatus, string> = {
  up: "bg-success",
  down: "bg-error",
  unknown: "bg-text-disabled",
};

export const FLAG_LABEL: Record<AppFlag, string> = {
  internal: "internal",
  "coming-soon": "coming soon",
  offline: "offline",
};

export const FLAG_CLASS: Record<AppFlag, string> = {
  internal: "border-border text-text-muted",
  "coming-soon": "border-accent/40 text-accent-text",
  offline: "border-error/40 text-error",
};

export const CATEGORY_LABEL: Record<AppCategory, string> = {
  redapps: "redApps",
  partners: "Partners",
  sites: "Sites",
  infra: "Infrastructure",
};

const TILE_BASE =
  "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-elevated";

/**
 * redBoard -> { prefix: "red", suffix: "board" }. Only redApp wordmarks get
 * the lowercase brand treatment; partner, site and infra names keep the
 * casing they carry in apps.json.
 */
export function splitWordmark(name: string) {
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

/** Effective status: a curated offline entry never shows green. */
export function shownStatus(app: AppEntry, status: AppStatus): AppStatus {
  return app.flags.includes("offline") ? "down" : status;
}

function GithubMark({ size }: { size: "sm" | "lg" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={size === "lg" ? "h-8 w-8" : "h-5 w-5"}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z" />
    </svg>
  );
}

export function monogramLetter(name: string) {
  const mark = splitWordmark(name);
  return mark ? mark.suffix[0] : (name[0] ?? "?");
}

/** Logo tile, or the monogram when the entry has no artwork. */
export function Tile({
  app,
  size = "sm",
}: {
  app: AppEntry;
  size?: "sm" | "lg";
}) {
  const box = size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const art = size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const px = size === "lg" ? 40 : 28;

  if (app.icon === "github") {
    return (
      <span
        aria-hidden="true"
        className={`${TILE_BASE} ${box} text-text-primary`}
      >
        <GithubMark size={size} />
      </span>
    );
  }

  if (!app.logo) {
    const mark = splitWordmark(app.name);
    return (
      <span
        aria-hidden="true"
        className={`${TILE_BASE} ${box} font-semibold leading-none ${
          size === "lg" ? "text-xl" : "text-base"
        } ${mark ? "text-accent-text" : "text-text-secondary"}`}
      >
        {monogramLetter(app.name)}
      </span>
    );
  }

  return (
    <span className={`${TILE_BASE} ${box}`}>
      <img
        src={app.logo}
        alt={`${app.name} logo`}
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        className={`${art} object-contain ${app.logoLight ? "logo-on-light" : ""}`}
      />
      {app.logoLight ? (
        <img
          src={app.logoLight}
          alt=""
          aria-hidden="true"
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          className={`logo-on-dark ${art} object-contain`}
        />
      ) : null}
    </span>
  );
}

/**
 * The visual block. The image is the nice-to-have and the monogram is the
 * floor: an entry with no `screenshot`, an offline or coming-soon entry, and
 * an entry whose file 404s all land on the same placeholder, so swapping the
 * artwork out from under this component can never leave a broken tile.
 * Shared by the detail panel and the featured cards; `className` carries the
 * frame each of them wants around the same 16:10 box.
 */
export function Visual({
  app,
  className = "",
}: {
  app: AppEntry;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const usable =
    !app.flags.includes("offline") &&
    !app.flags.includes("coming-soon") &&
    Boolean(app.screenshot) &&
    !broken;

  return (
    <div
      className={`aspect-[16/10] w-full overflow-hidden bg-background ${className}`}
    >
      {usable ? (
        <img
          src={app.screenshot}
          alt={`${app.name} preview`}
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
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

export function Wordmark({ name }: { name: string }) {
  const mark = splitWordmark(name);
  if (!mark) return <span className="text-text-primary">{name}</span>;
  return (
    <span className="lowercase">
      <span className="text-text-primary">{mark.prefix}</span>
      <span className="text-accent-text">{mark.suffix}</span>
    </span>
  );
}
