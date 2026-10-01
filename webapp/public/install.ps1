# Mirrored from redbtn-io/redbtn-cli (install.ps1 at the repo root).
# Do not edit here: change it there, re-verify, and copy it back.
# This copy is what https://redbtn.io/install.ps1 serves.
# Install (or update) the redbtn CLI from the public MinIO release channel.
#
#   irm https://redbtn.io/install.ps1 | iex
#   # with options:
#   & ([scriptblock]::Create((irm https://redbtn.io/install.ps1))) -Channel alpha
#   & ([scriptblock]::Create((irm https://redbtn.io/install.ps1))) -Version 0.0.18-alpha
#
# Mirrors install.sh: node >= 20 check, latest.json, tarball download,
# sha512 verification, `npm uninstall -g` then `npm i -g <tarball>`,
# real-directory verification, next steps. Idempotent (re-running updates).
#
# Env overrides: $env:REDBTN_CLI_DIST_URL, $env:REDBTN_CLI_CHANNEL.
# Mirrored from the redbtn-cli repo (install.ps1 at the repo root); the copy
# served at https://redbtn.io/install.ps1 is canonical for users.

param(
  [string]$Channel = $(if ($env:REDBTN_CLI_CHANNEL) { $env:REDBTN_CLI_CHANNEL } else { 'stable' }),
  [string]$Version = '',
  [string]$DistUrl = $(if ($env:REDBTN_CLI_DIST_URL) { $env:REDBTN_CLI_DIST_URL } else { '' })
)

$ErrorActionPreference = 'Stop'

function Fail([string]$msg) { Write-Error "install.ps1: $msg"; exit 1 }

if ($Channel -notin @('stable', 'alpha', 'test')) { Fail "unknown channel '$Channel' (stable|alpha)" }
if (-not $DistUrl) { $DistUrl = "https://models.redbtn.io/redbtn-models/cli/$Channel" }

# --- node >= 20 -------------------------------------------------------------
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail 'node >= 20 is required and was not found. Install it from https://nodejs.org (LTS), then re-run.' }
$nodeMajor = (& node -e 'console.log(process.versions.node.split(".")[0])').Trim()
if ([int]$nodeMajor -lt 20) { Fail "node >= 20 is required (found $(& node --version)). Install the LTS from https://nodejs.org, then re-run." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail 'npm was not found next to node. Reinstall node from https://nodejs.org, then re-run.' }

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("redbtn-install-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  # --- latest.json ----------------------------------------------------------
  Write-Host "→ channel: $Channel ($DistUrl)"
  $latestPath = Join-Path $tmp 'latest.json'
  try {
    Invoke-WebRequest -Uri "$DistUrl/latest.json" -OutFile $latestPath -UseBasicParsing -Headers @{ 'User-Agent' = 'redbtn-install/1.0' }
  } catch { Fail "could not fetch $DistUrl/latest.json (network down, or no release on '$Channel' yet?)" }
  $latest = Get-Content $latestPath -Raw | ConvertFrom-Json

  $Sha = $latest.sha512
  $Url = $latest.url
  $Want = $latest.version
  if ($Version) {
    if ($Want -ne $Version) {
      $Base = $Url.Substring(0, $Url.LastIndexOf('/'))
      $Url = "$Base/redbtn-cli-$Version.tgz"
      Write-Warning "pinned version $Version is not the channel tip ($Want); sha verification is skipped for pinned installs."
      $Sha = ''
    }
  }

  # --- download -------------------------------------------------------------
  Write-Host "→ downloading $Url"
  $tgzPath = Join-Path $tmp 'redbtn.tgz'
  try {
    Invoke-WebRequest -Uri $Url -OutFile $tgzPath -UseBasicParsing -Headers @{ 'User-Agent' = 'redbtn-install/1.0' }
  } catch { Fail "could not download $Url" }

  # --- verify sha512 --------------------------------------------------------
  if ($Sha) {
    $Actual = (Get-FileHash -Path $tgzPath -Algorithm SHA512).Hash
    if ($Actual.ToLower() -ne $Sha.ToLower()) { Fail 'sha512 mismatch for the downloaded tarball: refusing to install. Do not retry blindly — the download is corrupt or was swapped.' }
    Write-Host '→ sha512 ok'
  }

  # --- install --------------------------------------------------------------
  # The tarball flow only: never `npm link`, never `npm i -g .` from a checkout.
  & npm uninstall -g @redbtn/cli 2>$null | Out-Null
  & npm install -g $tgzPath
  if ($LASTEXITCODE -ne 0) { Fail '`npm install -g` failed. Try an elevated prompt, or a node version manager.' }

  # --- verify it's real -----------------------------------------------------
  $prefix = (& npm root -g).Trim()
  $dir = Join-Path $prefix '@redbtn\cli'
  $item = Get-Item $dir -ErrorAction SilentlyContinue
  if (-not $item -or ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
    Fail "the global @redbtn/cli is not a real directory ($dir). If you used 'npm link' here, run 'npm unlink -g @redbtn/cli' and re-run this script."
  }
  Write-Host "→ installed to $dir"

  $Installed = (& redbtn --version) 2>$null
  Write-Host "✓ redbtn $Installed"
  Write-Host ''
  Write-Host 'next steps:'
  Write-Host '  redbtn login     sign in (opens the browser once)'
  Write-Host '  redbtn connect   keep this machine connected in the background'
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
