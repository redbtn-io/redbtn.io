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
# If node is missing (or older than 20), the script offers to install the
# current Node.js LTS itself, mirroring install.sh: it downloads the
# official zip from nodejs.org, verifies its sha256, and unpacks it into
# %USERPROFILE%\.local\redbtn-node (no admin, no system installer, any
# system node left untouched), then adds that directory to the user PATH.
# The offer is a prompt, the script never installs node silently; -Yes
# (or $env:REDBTN_INSTALL_NODE = '1', the only route under `irm | iex`)
# pre-answers it for scripted installs. When there is no console to ask
# on, it prints the manual instructions and stops, like before.
#
# Env overrides: $env:REDBTN_CLI_DIST_URL, $env:REDBTN_CLI_CHANNEL,
# $env:REDBTN_INSTALL_NODE, $env:REDBTN_NODE_VERSION,
# $env:REDBTN_NODE_DIST_URL, $env:REDBTN_NODE_HOME.
# Mirrored from the redbtn-cli repo (install.ps1 at the repo root); the copy
# served at https://redbtn.io/install.ps1 is canonical for users.

param(
  [string]$Channel = $(if ($env:REDBTN_CLI_CHANNEL) { $env:REDBTN_CLI_CHANNEL } else { 'stable' }),
  [string]$Version = '',
  [string]$DistUrl = $(if ($env:REDBTN_CLI_DIST_URL) { $env:REDBTN_CLI_DIST_URL } else { '' }),
  [switch]$Yes = $($env:REDBTN_INSTALL_NODE -eq '1')
)

$ErrorActionPreference = 'Stop'

function Fail([string]$msg) { Write-Error "install.ps1: $msg"; exit 1 }

if ($Channel -notin @('stable', 'alpha', 'test')) { Fail "unknown channel '$Channel' (stable|alpha)" }
if (-not $DistUrl) { $DistUrl = "https://models.redbtn.io/redbtn-models/cli/$Channel" }

# --- node >= 20 -------------------------------------------------------------
$NodeHome = $(if ($env:REDBTN_NODE_HOME) { $env:REDBTN_NODE_HOME } else { Join-Path $HOME '.local\redbtn-node' })
$NodeBootstrapped = $false

function Get-NodeMajor {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return 0 }
  try {
    $v = (& node -p "process.versions.node.split('.')[0]") 2>$null
    if ($v) { return [int]$v.Trim() }
  } catch { }
  return 0
}

function Confirm-NodeInstall {
  if ($Yes) { return $true }
  # No console to ask on (piped input, non-interactive host): never hang
  # waiting for an answer that cannot come.
  if ([Console]::IsInputRedirected) { return $false }
  try {
    $ans = Read-Host "install.ps1: install the current Node.js LTS into $NodeHome now? [y/N]"
  } catch { return $false }
  return ($ans -match '^(y|yes)$')
}

function Install-Node {
  # A previous bootstrap may already have left a good node behind.
  if ((Test-Path (Join-Path $NodeHome 'node.exe')) -and (Test-Path (Join-Path $NodeHome 'npm.cmd'))) {
    $env:PATH = "$NodeHome;$env:PATH"
    if ((Get-NodeMajor) -ge 20) {
      Write-Host "-> using node $(& node --version) already installed at $NodeHome"
      $script:NodeBootstrapped = $true
      return
    }
  }

  $arch = $env:PROCESSOR_ARCHITECTURE
  switch ($arch) {
    'AMD64' { $arch = 'x64' }
    'ARM64' { $arch = 'arm64' }
    default { Fail "the node bootstrap does not know the '$arch' architecture. Install node >= 20 from https://nodejs.org, then re-run." }
  }

  $dist = $(if ($env:REDBTN_NODE_DIST_URL) { $env:REDBTN_NODE_DIST_URL } else { 'https://nodejs.org/dist' })
  $ver = $env:REDBTN_NODE_VERSION
  $btmp = Join-Path ([System.IO.Path]::GetTempPath()) ("redbtn-node-" + [System.Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $btmp | Out-Null
  try {
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }
    if (-not $ver) {
      # index.json lists newest first; the first entry whose lts field is
      # a string is the current LTS.
      try {
        $idx = Invoke-RestMethod -Uri "$dist/index.json" -UseBasicParsing -Headers @{ 'User-Agent' = 'redbtn-install/1.0' }
        $lts = $idx | Where-Object { $_.lts -is [string] } | Select-Object -First 1
        if ($lts) { $ver = $lts.version }
      } catch { }
      if (-not $ver -or $ver -notmatch '^v\d') { $ver = 'v22.14.0' } # fetch/parse failed: fall back to a known LTS
    }
    $file = "node-$ver-win-$arch.zip"
    $zipPath = Join-Path $btmp 'node.zip'
    Write-Host "-> downloading $file from nodejs.org"
    try {
      Invoke-WebRequest -Uri "$dist/$ver/$file" -OutFile $zipPath -UseBasicParsing -Headers @{ 'User-Agent' = 'redbtn-install/1.0' }
    } catch { Fail "could not download $dist/$ver/$file" }

    # Verify against the release's own SHASUMS256.txt.
    try {
      $sumsPath = Join-Path $btmp 'SHASUMS256.txt'
      Invoke-WebRequest -Uri "$dist/$ver/SHASUMS256.txt" -OutFile $sumsPath -UseBasicParsing -Headers @{ 'User-Agent' = 'redbtn-install/1.0' }
      $line = Get-Content $sumsPath | Where-Object { $_ -match [regex]::Escape($file) } | Select-Object -First 1
      if ($line) {
        $want = ($line -split '\s+')[0]
        $got = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash
        if ($got.ToLower() -ne $want.ToLower()) { Fail "sha256 mismatch for ${file}: refusing to install. Do not retry blindly, the download is corrupt or was swapped." }
        Write-Host '-> node sha256 ok'
      }
    } catch {
      if ($_.Exception.Message -like 'install.ps1:*') { throw }
      Write-Warning 'could not verify the node checksum (SHASUMS256.txt unavailable); continuing.'
    }

    # Unpack into a scratch dir first, verify the result runs, and only
    # then move it into place.
    $stage = Join-Path $btmp 'node-x'
    Expand-Archive -Path $zipPath -DestinationPath $stage
    $inner = Join-Path $stage "node-$ver-win-$arch"
    if (-not (Test-Path (Join-Path $inner 'node.exe')) -or -not (Test-Path (Join-Path $inner 'npm.cmd'))) {
      Fail 'the downloaded node zip does not contain a runnable node/npm pair.'
    }
    if (Test-Path $NodeHome) { Remove-Item -Recurse -Force $NodeHome }
    New-Item -ItemType Directory -Path (Split-Path $NodeHome -Parent) -Force | Out-Null
    Move-Item $inner $NodeHome
  } finally {
    Remove-Item -Recurse -Force $btmp -ErrorAction SilentlyContinue
  }
  $env:PATH = "$NodeHome;$env:PATH"
  if ((Get-NodeMajor) -lt 20) { Fail 'the node bootstrap finished but node is still not >= 20 on PATH. Open a new terminal and re-run.' }
  Write-Host "-> installed node $(& node --version) at $NodeHome"
  $script:NodeBootstrapped = $true

  # Make future shells see this node (and the redbtn it later hosts):
  # add it to the user PATH if it is not already there.
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  if (-not $userPath) { $userPath = '' }
  $parts = $userPath -split ';' | Where-Object { $_ }
  if ($parts -notcontains $NodeHome) {
    [Environment]::SetEnvironmentVariable('Path', (($parts + $NodeHome) -join ';'), 'User')
    Write-Host "-> added $NodeHome to your user PATH"
  }
}

if ((Get-NodeMajor) -lt 20) {
  if (Get-Command node -ErrorAction SilentlyContinue) {
    $foundLine = "node found $(& node --version), and redbtn needs >= 20"
  } else {
    $foundLine = 'node was not found, and redbtn needs >= 20'
  }
  Write-Host "install.ps1: $foundLine."
  Write-Host "install.ps1: I can install the current Node.js LTS from nodejs.org into $NodeHome myself: no admin, no system changes, any existing node stays untouched."
  if (Confirm-NodeInstall) {
    Install-Node
  } else {
    Fail 'no node installed. Install it from https://nodejs.org (LTS), then re-run. Tip: re-run with -Yes to let this script install node for you.'
  }
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail 'npm was not found next to node. Reinstall node from https://nodejs.org, then re-run.' }

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("redbtn-install-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  # --- latest.json ----------------------------------------------------------
  Write-Host "-> channel: $Channel ($DistUrl)"
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
  Write-Host "-> downloading $Url"
  $tgzPath = Join-Path $tmp 'redbtn.tgz'
  try {
    Invoke-WebRequest -Uri $Url -OutFile $tgzPath -UseBasicParsing -Headers @{ 'User-Agent' = 'redbtn-install/1.0' }
  } catch { Fail "could not download $Url" }

  # --- verify sha512 --------------------------------------------------------
  if ($Sha) {
    $Actual = (Get-FileHash -Path $tgzPath -Algorithm SHA512).Hash
    if ($Actual.ToLower() -ne $Sha.ToLower()) { Fail 'sha512 mismatch for the downloaded tarball: refusing to install. Do not retry blindly - the download is corrupt or was swapped.' }
    Write-Host '-> sha512 ok'
  }

  # --- install --------------------------------------------------------------
  # The tarball flow only: never `npm link`, never `npm i -g .` from a checkout.
  & npm uninstall -g @redbtn/cli 2>$null | Out-Null
  & npm install -g $tgzPath
  if ($LASTEXITCODE -ne 0) { Fail "'npm install -g' failed. Try an elevated prompt, or a node version manager." }

  # --- verify it's real -----------------------------------------------------
  $prefix = (& npm root -g).Trim()
  $dir = Join-Path $prefix '@redbtn\cli'
  $item = Get-Item $dir -ErrorAction SilentlyContinue
  if (-not $item -or ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
    Fail "the global @redbtn/cli is not a real directory ($dir). If you used 'npm link' here, run 'npm unlink -g @redbtn/cli' and re-run this script."
  }
  Write-Host "-> installed to $dir"

  $Installed = (& redbtn --version) 2>$null
  Write-Host "OK redbtn $Installed"
  Write-Host ''
  if ($NodeBootstrapped) {
    Write-Host "note: node and redbtn live in $NodeHome, which was added to your"
    Write-Host 'user PATH. Open a new terminal if ''redbtn'' is not found yet.'
    Write-Host ''
  }
  Write-Host 'next steps:'
  Write-Host '  redbtn login     sign in (opens the browser once)'
  Write-Host '  redbtn connect   keep this machine connected in the background'
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
