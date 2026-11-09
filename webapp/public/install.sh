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
# If node is missing (or older than 20), the script offers to install the
# current Node.js LTS itself: it downloads the official tarball from
# nodejs.org, verifies its sha256, and unpacks it into
# ~/.local/redbtn-node (no sudo, no system package manager, any system
# node left untouched), then adds that directory to the PATH of the
# user's shell rc file. The offer is a prompt on the terminal, the
# script never installs node silently; --yes (or REDBTN_INSTALL_NODE=1)
# pre-answers it for scripted installs. With no terminal to ask on,
# it prints the manual instructions and stops, like before.
#
# Idempotent: re-running it installs the channel's current version again,
# so re-running IS the update. (`redbtn update` does the same in place.)
#
# Env overrides (mostly for tests):
#   REDBTN_CLI_DIST_URL   channel base URL, e.g. .../cli/alpha or .../cli/test
#   REDBTN_CLI_CHANNEL    default channel when --channel is absent
#   REDBTN_INSTALL_NODE   1 = pre-confirm the node install offer
#   REDBTN_NODE_VERSION   pin the node version the bootstrap installs
#   REDBTN_NODE_DIST_URL  node dist base URL (default https://nodejs.org/dist)
#
# Mirrored from the redbtn-cli repo (install.sh at the repo root); the copy
# served at https://redbtn.io/install.sh is canonical for users.

set -eu

CHANNEL="${REDBTN_CLI_CHANNEL:-stable}"
VERSION=""
DIST_URL="${REDBTN_CLI_DIST_URL:-}"
ASSUME_YES=0
[ "${REDBTN_INSTALL_NODE:-}" = "1" ] && ASSUME_YES=1

usage() {
  echo "usage: install.sh [--channel stable|alpha] [--version X.Y.Z] [--yes]" 1>&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --channel) CHANNEL="${2:?--channel needs a value}"; shift 2 ;;
    --channel=*) CHANNEL="${1#--channel=}"; shift ;;
    --version) VERSION="${2:?--version needs a value}"; shift 2 ;;
    --version=*) VERSION="${1#--version=}"; shift ;;
    -y|--yes) ASSUME_YES=1; shift ;;
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
NODE_HOME="${REDBTN_NODE_HOME:-$HOME/.local/redbtn-node}"
NODE_BOOTSTRAPPED=0

node_major() {
  command -v node >/dev/null 2>&1 || { echo 0; return; }
  node -e 'console.log(process.versions.node.split(".")[0])' 2>/dev/null || echo 0
}

# Ask on the real terminal. stdin is the script itself when the user ran
# `curl ... | sh`, so reading stdin would eat the script; /dev/tty is the
# only honest place to ask. Returns 1 when there is nobody to ask.
confirm_node_install() {
  if [ "$ASSUME_YES" = "1" ]; then
    return 0
  fi
  if ! ( : < /dev/tty ) 2>/dev/null || ! ( : > /dev/tty ) 2>/dev/null; then
    return 1
  fi
  printf '%s' "install.sh: install the current Node.js LTS into $NODE_HOME now? [y/N] " > /dev/tty
  ans=""
  read -r ans < /dev/tty || ans=""
  case "$ans" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

install_node() {
  command -v curl >/dev/null 2>&1 || die "curl was not found, and the node bootstrap needs it. Install curl, or install node from https://nodejs.org, then re-run."
  command -v tar >/dev/null 2>&1 || die "tar was not found, and the node bootstrap needs it. Install tar, or install node from https://nodejs.org, then re-run."

  # A previous bootstrap may already have left a good node behind.
  if [ -x "$NODE_HOME/bin/node" ] && [ -e "$NODE_HOME/bin/npm" ]; then
    PATH="$NODE_HOME/bin:$PATH"; export PATH
    if [ "$(node_major)" -ge 20 ]; then
      echo "→ using node $(node --version) already installed at $NODE_HOME"
      NODE_BOOTSTRAPPED=1
      return 0
    fi
  fi

  os="$(uname -s)"
  case "$os" in
    Darwin) os="darwin" ;;
    Linux) os="linux" ;;
    *) die "the node bootstrap does not know '$os'. Install node >= 20 from https://nodejs.org, then re-run." ;;
  esac
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) die "the node bootstrap does not know the '$arch' architecture. Install node >= 20 from https://nodejs.org, then re-run." ;;
  esac

  dist="${REDBTN_NODE_DIST_URL:-https://nodejs.org/dist}"
  ver="${REDBTN_NODE_VERSION:-}"
  btmp="$(mktemp -d)"
  if [ -z "$ver" ]; then
    # index.json lists newest first, one object per line; the first entry
    # whose lts field is a string is the current LTS.
    if curl -fsSL -A 'redbtn-install/1.0' "$dist/index.json" -o "$btmp/index.json" 2>/dev/null; then
      ver="$(grep -m 1 '"lts":"' "$btmp/index.json" | sed -e 's/.*"version":"//' -e 's/".*//' || true)"
    fi
    case "$ver" in
      v[0-9]*) ;;
      *) ver="v22.14.0" ;; # parse failed: fall back to a known LTS
    esac
  fi
  file="node-$ver-$os-$arch.tar.gz"
  echo "→ downloading $file from nodejs.org"
  curl -fsSL -A 'redbtn-install/1.0' "$dist/$ver/$file" -o "$btmp/node.tar.gz" \
    || { rm -rf "$btmp"; die "could not download $dist/$ver/$file"; }

  # Verify against the release's own SHASUMS256.txt.
  if curl -fsSL -A 'redbtn-install/1.0' "$dist/$ver/SHASUMS256.txt" -o "$btmp/SHASUMS256.txt" 2>/dev/null; then
    want="$(awk -v f="$file" '$2 == f {print $1}' "$btmp/SHASUMS256.txt")"
    if [ -n "$want" ]; then
      if command -v shasum >/dev/null 2>&1; then
        got="$(shasum -a 256 "$btmp/node.tar.gz" | awk '{print $1}')"
      elif command -v sha256sum >/dev/null 2>&1; then
        got="$(sha256sum "$btmp/node.tar.gz" | awk '{print $1}')"
      else
        got=""
        echo "→ no sha256 tool found; skipping node checksum verification" 1>&2
      fi
      if [ -n "$got" ] && [ "$got" != "$want" ]; then
        rm -rf "$btmp"
        die "sha256 mismatch for $file: refusing to install. Do not retry blindly, the download is corrupt or was swapped."
      fi
      [ -n "$got" ] && echo "→ node sha256 ok"
    fi
  fi

  # Unpack into a scratch dir first (-o: never chown to the tarball's
  # recorded owner, which fails for root in containers), verify the
  # result runs, and only then move it into place.
  mkdir -p "$btmp/node-x"
  tar -xzof "$btmp/node.tar.gz" -C "$btmp/node-x" --strip-components 1 \
    || { rm -rf "$btmp"; die "could not unpack node into $NODE_HOME"; }
  if [ ! -x "$btmp/node-x/bin/node" ] || [ ! -e "$btmp/node-x/bin/npm" ]; then
    rm -rf "$btmp"
    die "the downloaded node tarball does not contain a runnable node/npm pair."
  fi
  rm -rf "$NODE_HOME"
  mkdir -p "$(dirname "$NODE_HOME")"
  mv "$btmp/node-x" "$NODE_HOME" || { rm -rf "$btmp"; die "could not move node into $NODE_HOME"; }
  rm -rf "$btmp"
  PATH="$NODE_HOME/bin:$PATH"; export PATH
  hash -r 2>/dev/null || true
  if [ "$(node_major)" -lt 20 ]; then
    die "the node bootstrap finished but node is still not >= 20 on PATH. Open a new terminal and re-run."
  fi
  echo "→ installed node $(node --version) at $NODE_HOME"
  NODE_BOOTSTRAPPED=1

  # Make future shells see this node (and the redbtn it later hosts).
  rc_written=""
  for rc in "$HOME/.zshrc" "$HOME/.bashrc"; do
    if [ -f "$rc" ] && ! grep -q 'redbtn-node' "$rc" 2>/dev/null; then
      printf '%s\n' 'export PATH="$HOME/.local/redbtn-node/bin:$PATH" # added by redbtn install.sh' >> "$rc"
      rc_written="$rc_written $rc"
    fi
  done
  if [ -z "$rc_written" ]; then
    case "${SHELL:-}" in
      *zsh) rc="$HOME/.zshrc" ;;
      *) rc="$HOME/.bashrc" ;;
    esac
    if ! grep -q 'redbtn-node' "$rc" 2>/dev/null; then
      printf '%s\n' 'export PATH="$HOME/.local/redbtn-node/bin:$PATH" # added by redbtn install.sh' >> "$rc"
      rc_written=" $rc"
    fi
  fi
  [ -n "$rc_written" ] && echo "→ added $NODE_HOME/bin to PATH in$rc_written"
  return 0
}

if [ "$(node_major)" -lt 20 ]; then
  if command -v node >/dev/null 2>&1; then
    found="found $(node --version), and redbtn needs >= 20"
  else
    found="was not found, and redbtn needs >= 20"
  fi
  echo "install.sh: node $found."
  echo "install.sh: I can install the current Node.js LTS from nodejs.org into $NODE_HOME myself: no sudo, no system changes, any existing node stays untouched."
  if confirm_node_install; then
    install_node
  else
    die "no node installed. Install it with 'brew install node' or from https://nodejs.org, then re-run. Tip: re-run with --yes to let this script install node for you."
  fi
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
npm install -g "$TMP/redbtn.tgz" || die "'npm install -g' failed (permissions? try a node version manager, or sudo)."

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
if [ "$NODE_BOOTSTRAPPED" = "1" ]; then
  echo "note: node and redbtn live in $NODE_HOME/bin, which was added to your"
  echo "shell startup file. Open a new terminal if 'redbtn' is not found yet."
  echo
fi
echo "next steps:"
echo "  redbtn login     sign in (opens the browser once)"
echo "  redbtn connect   keep this machine connected in the background"
