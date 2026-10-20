"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apps, type AppCategory, type AppStatus } from "@/data/apps";
import AppCard from "./AppCard";
import AppDetail from "./AppDetail";
import FeaturedCard from "./FeaturedCard";
import { CATEGORY_LABEL, hostLabel } from "./parts";

const FILTERS: { id: AppCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "redapps", label: "redApps" },
  { id: "partners", label: "Partners" },
  { id: "sites", label: "Sites" },
  { id: "infra", label: "Infrastructure" },
];

const GROUP_ORDER: AppCategory[] = ["redapps", "partners", "sites", "infra"];

/**
 * The featured row, straight from the data: any entry carrying a `featured`
 * rank, lowest first. Editing apps.json is the only way to change the set or
 * the order.
 */
const featured = apps
  .filter((app) => typeof app.featured === "number")
  .sort((a, b) => (a.featured as number) - (b.featured as number));

const featuredIds = new Set(featured.map((app) => app.id));

function isStatus(value: unknown): value is AppStatus {
  return value === "up" || value === "down" || value === "unknown";
}

export default function AppsGrid() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AppCategory | "all">("all");
  const [statuses, setStatuses] = useState<Record<string, AppStatus>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  // True while this component owns a history entry it pushed itself.
  const pushed = useRef(false);

  // Deep link on first paint, and keep the browser back button honest.
  useEffect(() => {
    const sync = () => {
      const id = new URLSearchParams(window.location.search).get("app");
      setOpenId(id && apps.some((app) => app.id === id) ? id : null);
      pushed.current = false;
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const openApp = useCallback((id: string) => {
    setOpenId(id);
    window.history.pushState({ appPanel: id }, "", `?app=${encodeURIComponent(id)}`);
    pushed.current = true;
  }, []);

  const closeApp = useCallback(() => {
    if (pushed.current) {
      // Popping our own entry runs `sync`, which clears the panel.
      window.history.back();
      return;
    }
    window.history.replaceState({}, "", window.location.pathname);
    setOpenId(null);
  }, []);

  // The global stylesheet locks scrolling for the title screen. /apps is a
  // normal scrolling page, except while a detail panel is open.
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const value = openId ? "hidden" : "auto";
    html.style.overflow = value;
    body.style.overflow = value;
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [openId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/apps/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelled || !data || typeof data !== "object") return;
        const next: Record<string, AppStatus> = {};
        for (const [id, value] of Object.entries(data as Record<string, unknown>)) {
          if (isStatus(value)) next[id] = value;
        }
        setStatuses(next);
      })
      .catch(() => {
        /* status is a nicety, never break the page */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (category !== "all" && app.category !== category) return false;
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.highlights.some((h) => h.toLowerCase().includes(q)) ||
        hostLabel(app.url).toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  // Featured shows only at rest. Once the page is filtered the row goes away
  // and those entries take their normal places in the grid.
  const showFeatured =
    featured.length > 0 && query.trim() === "" && category === "all";

  const groups = useMemo(() => {
    const items = showFeatured
      ? filtered.filter((app) => !featuredIds.has(app.id))
      : filtered;
    return GROUP_ORDER.map((id) => ({
      id,
      label: CATEGORY_LABEL[id],
      items: items.filter((app) => app.category === id),
    })).filter((group) => group.items.length > 0);
  }, [filtered, showFeatured]);

  const open = openId ? apps.find((app) => app.id === openId) : undefined;

  return (
    <main className="apps-route min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to redbtn"
              title="Back to redbtn"
              className="shrink-0 rounded-full"
            >
              <Image
                src="/red.png"
                alt=""
                width={32}
                height={32}
                priority
                className="h-8 w-8 rounded-full"
              />
            </Link>
            <h1 className="text-lg font-semibold lowercase tracking-tight">
              apps
            </h1>
            <span className="ml-auto font-mono text-[11px] text-text-muted">
              {filtered.length}/{apps.length}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        {showFeatured ? (
          <section className="mb-4" aria-labelledby="apps-featured">
            <h2
              id="apps-featured"
              className="mb-2 text-lg font-semibold lowercase tracking-tight"
            >
              featured
            </h2>
            <div className="apps-featured-row">
              {featured.map((app) => (
                <FeaturedCard
                  key={app.id}
                  app={app}
                  status={statuses[app.id] ?? "unknown"}
                  onOpen={openApp}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="sticky top-[57px] z-10 -mx-4 mb-4 border-b border-border bg-background/90 px-4 py-2 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search apps"
              aria-label="Search apps"
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none sm:max-w-xs"
            />
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
              {FILTERS.map((filter) => {
                const active = filter.id === category;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setCategory(filter.id)}
                    aria-pressed={active}
                    className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-bg-elevated text-text-secondary hover:border-border-hover hover:text-text-primary"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-text-muted">
            Nothing matches that search.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.id} className="mb-6 last:mb-0">
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                {group.label}
              </h2>
              <div className="grid auto-rows-fr grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-3">
                {group.items.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    status={statuses[app.id] ?? "unknown"}
                    onOpen={openApp}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {open ? (
        <AppDetail
          app={open}
          status={statuses[open.id] ?? "unknown"}
          onClose={closeApp}
        />
      ) : null}
    </main>
  );
}
