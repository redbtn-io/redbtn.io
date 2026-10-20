/**
 * Capture a front-page screenshot for every live /apps entry.
 *
 * Self-contained: this directory has its own package.json and node_modules
 * (gitignored), so the Next.js app's lockfile and Docker build never see
 * playwright or sharp.
 *
 *   node node_modules/playwright/cli.js install chromium   # once
 *   node capture.mjs [--force] [id ...]
 *
 * Idempotent: an entry whose .webp already exists is skipped unless
 * --force is passed or its id is named explicitly.
 *
 * An entry is skipped when it has no URL, is flagged offline or coming
 * soon, does not answer 200 with HTML, or redirects to a different site.
 * Those keep the monogram placeholder in the detail panel.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEBAPP = path.resolve(HERE, "../..");
const APPS = path.join(WEBAPP, "src/data/apps.json");
const OUT = path.join(WEBAPP, "public/shots");

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const VIEWPORT = { width: 1280, height: 800 };
const TARGET = { width: 800, height: 500 };
const MAX_BYTES = 70 * 1024;
const QUALITIES = [75, 65, 55, 45];

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const only = argv.filter((a) => !a.startsWith("--"));

const site = (u) => new URL(u).hostname.replace(/^www\./, "");

function skipReason(app) {
  if (!app.url) return "no url";
  if (app.flags.includes("coming-soon")) return "coming soon";
  if (app.flags.includes("offline")) return "flagged offline";
  return null;
}

async function reachable(url) {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { ok: false, why: `http ${res.status}` };
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!ct.includes("text/html")) return { ok: false, why: `type ${ct.split(";")[0] || "unknown"}` };
    if (site(res.url) !== site(url))
      return { ok: false, why: `redirects to ${site(res.url)}` };
    return { ok: true, url: res.url };
  } catch (err) {
    return { ok: false, why: err.message };
  }
}

async function encode(png) {
  for (const quality of QUALITIES) {
    const buf = await sharp(png)
      .resize(TARGET.width, TARGET.height, { fit: "cover", position: "top" })
      .webp({ quality })
      .toBuffer();
    if (buf.length <= MAX_BYTES || quality === QUALITIES.at(-1))
      return { buf, quality };
  }
}

const apps = JSON.parse(readFileSync(APPS, "utf8"));
mkdirSync(OUT, { recursive: true });

const queue = apps.filter((a) => (only.length ? only.includes(a.id) : true));
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  userAgent: UA,
  deviceScaleFactor: 1,
  colorScheme: "light",
  reducedMotion: "reduce",
  locale: "en-US",
});

let captured = 0;
let skipped = 0;

for (const app of queue) {
  const dest = path.join(OUT, `${app.id}.webp`);
  const named = only.includes(app.id);

  const why = skipReason(app);
  if (why) {
    console.log(`SKIP  ${app.id.padEnd(22)} ${why}`);
    skipped++;
    continue;
  }
  if (existsSync(dest) && !force && !named) {
    console.log(`HAVE  ${app.id.padEnd(22)} ${statSync(dest).size}B`);
    continue;
  }

  const check = await reachable(app.url);
  if (!check.ok) {
    console.log(`SKIP  ${app.id.padEnd(22)} ${check.why}`);
    skipped++;
    continue;
  }

  const page = await context.newPage();
  try {
    await page.goto(app.url, { waitUntil: "networkidle", timeout: 45000 });
  } catch {
    try {
      await page.goto(app.url, { waitUntil: "load", timeout: 30000 });
    } catch (err) {
      console.log(`FAIL  ${app.id.padEnd(22)} ${err.message.split("\n")[0]}`);
      await page.close();
      skipped++;
      continue;
    }
  }

  try {
    await page.waitForTimeout(2000);
    const png = await page.screenshot({ type: "png" });
    const { buf, quality } = await encode(png);
    await sharp(buf).toFile(dest);
    console.log(`OK    ${app.id.padEnd(22)} ${buf.length}B q${quality}`);
    captured++;
  } catch (err) {
    console.log(`FAIL  ${app.id.padEnd(22)} ${err.message.split("\n")[0]}`);
    skipped++;
  } finally {
    await page.close();
  }
}

await context.close();
await browser.close();
console.log(`\ncaptured ${captured}, skipped ${skipped}`);
