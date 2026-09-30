# Mirrored from redbtn-io/redbtn-cli (install.sh at the repo root).
# Do not edit here: change it there, re-verify, and copy it back.
# This copy is what https://redbtn.io/install.sh serves.
#!/bin/sh
# Install (or update) the redbtn CLI from the public MinIO release channel.
#
#   curl -fsSL https://redbtn.io/install.sh | sh
#   curl -fsSL https://redbtn.io/install.sh | sh -s -- --channel alpha
#   curl -fsSL https://redbtn.io/install.sh | sh -s -- --version 0.0.18-alpha
#
# What it does: checks for node >= 20, fetches latest.json for the channel,
# downloads the tarball, verifies its sha512, runs `npm uninstall -g`
# quietly then `npm i -g <tarball>`, verifies the install is a real
# directory (not a symlink left by `npm link`), and prints the next steps.
#
# Idempotent: re-running it installs the channel's current version again,
# so re-running IS the update. (`redbtn update` does the same in place.)
#
# Env overrides (mostly for tests):
#   REDBTN_CLI_DIST_URL   channel base URL, e.g. .../cli/alpha or .../cli/test
#   REDBTN_CLI_CHANNEL    default channel when --channel is absent
#
# Mirrored from the redbtn-cli repo (install.sh at the repo root); the copy
# served at https://redbtn.io/install.sh is canonical for users.

set -eu

CHANNEL="${REDBTN_CLI_CHANNEL:-stable}"
VERSION=""
DIST_URL="${REDBTN_CLI_DIST_URL:-}"

usage() {
  echo "usage: install.sh [--channel stable|alpha] [--version X.Y.Z]" 1>&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --channel) CHANNEL="${2:?--channel needs a value}"; shift 2 ;;
    --channel=*) CHANNEL="${1#--channel=}"; shift ;;
    --version) VERSION="${2:?--version needs a value}"; shift 2 ;;
    --version=*) VERSION="${1#--version=}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "install.sh: unknown option $1" 1>&2; usage; exit 2 ;;
  esac
done

case "$CHANNEL" in
  stable|alpha|test) ;;
  *) echo "install.sh: unknown channel '$CHANNEL' (stable|alpha)" 1>&2; exit 2 ;;
esac

if [ -z "$DIST_URL" ]; then
  DIST_URL="https://models.redbtn.io/redbtn-models/cli/$CHANNEL"
fi

die() { echo "install.sh: $*" 1>&2; exit 1; }

# --- node >= 20 -------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  die "node >= 20 is required and was not found. Install it with 'brew install node' or from https://nodejs.org, then re-run."
fi
NODE_MAJOR="$(node -e 'console.log(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  die "node >= 20 is required (found $(node --version)). Upgrade with 'brew upgrade node' or from https://nodejs.org, then re-run."
fi
command -v npm >/dev/null 2>&1 || die "npm was not found next to node. Reinstall node from https://nodejs.org, then re-run."
command -v curl >/dev/null 2>&1 || die "curl was not found. Install it, then re-run."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT INT TERM

# --- latest.json ------------------------------------------------------------
echo "→ channel: $CHANNEL ($DIST_URL)"
curl -fsSL -A 'redbtn-install/1.0' "$DIST_URL/latest.json" -o "$TMP/latest.json" \
  || die "could not fetch $DIST_URL/latest.json (network down, or no release on '$CHANNEL' yet?)"

if [ -n "$VERSION" ]; then
  WANT="$VERSION"
else
  WANT="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).version)' "$TMP/latest.json")"
fi
URL="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).url)' "$TMP/latest.json")"
SHA="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).sha512)' "$TMP/latest.json")"
if [ -n "$VERSION" ] && [ "$WANT" != "$VERSION" ]; then
  # Pinned to a version the channel index doesn't carry: derive the sibling URL.
  BASE="$(dirname "$URL")"
  URL="$BASE/redbtn-cli-$VERSION.tgz"
  echo "→ pinned version $VERSION is not the channel tip ($WANT); sha verification is skipped for pinned installs." 1>&2
  SHA=""
fi

# --- download ---------------------------------------------------------------
echo "→ downloading $URL"
curl -fsSL -A 'redbtn-install/1.0' "$URL" -o "$TMP/redbtn.tgz" \
  || die "could not download $URL"

# --- verify sha512 ----------------------------------------------------------
if [ -n "$SHA" ]; then
  if command -v shasum >/dev/null 2>&1; then
    ACTUAL="$(shasum -a 512 "$TMP/redbtn.tgz" | awk '{print $1}')"
  elif command -v sha512sum >/dev/null 2>&1; then
    ACTUAL="$(sha512sum "$TMP/redbtn.tgz" | awk '{print $1}')"
  else
    ACTUAL="$(node -e 'console.log(require("crypto").createHash("sha512").update(require("fs").readFileSync(process.argv[1])).digest("hex"))' "$TMP/redbtn.tgz")"
  fi
  # Compare case-insensitively, in constant time as far as sh allows.
  if [ "$(printf '%s' "$ACTUAL" | tr 'A-F' 'a-f')" != "$(printf '%s' "$SHA" | tr 'A-F' 'a-f')" ]; then
    die "sha512 mismatch for $(basename "$URL"): refusing to install (expected ${SHA%"${SHA#????????????????}"}..., got ${ACTUAL%"${ACTUAL#????????????????}"}...). Do not retry blindly — the download is corrupt or was swapped."
  fi
  echo "→ sha512 ok"
fi

# --- install ----------------------------------------------------------------
# The tarball flow only: never `npm link`, never `npm i -g .` from a checkout.
npm uninstall -g @redbtn/cli >/dev/null 2>&1 || true
npm install -g "$TMP/redbtn.tgz" || die "`npm install -g` failed (permissions? try a node version manager, or sudo)."

# --- verify it's real -------------------------------------------------------
# A symlinked @redbtn/cli means a dev checkout is shadowing the install
# (`npm link`); refuse to bless that as an install.
REAL_CHECK="$(node -e '
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
try {
  const prefix = execSync("npm root -g", { encoding: "utf8" }).trim();
  const dir = path.join(prefix, "@redbtn", "cli");
  const st = fs.lstatSync(dir);
  if (st.isSymbolicLink()) { console.log("SYMLINK:" + fs.readlinkSync(dir)); process.exit(0); }
  if (!st.isDirectory()) { console.log("NOTDIR"); process.exit(0); }
  console.log("OK:" + dir);
} catch (e) { console.log("MISSING:" + e.message); }
')"
case "$REAL_CHECK" in
  OK:*) echo "→ installed to ${REAL_CHECK#OK:}" ;;
  *) die "the global @redbtn/cli is not a real directory ($REAL_CHECK). If you used 'npm link' here, run 'npm unlink -g @redbtn/cli' and re-run this script." ;;
esac

INSTALLED="$(redbtn --version 2>/dev/null || echo "?")"
echo "✓ redbtn $INSTALLED"
echo
echo "next steps:"
echo "  redbtn login     sign in (opens the browser once)"
echo "  redbtn connect   keep this machine connected in the background"
