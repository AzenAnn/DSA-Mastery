[CmdletBinding()]
param(
    [ValidateSet("runtime", "basic", "full")]
    [string]$Profile,
    [string]$RepoDir,
    [string]$RepoUrl = "https://github.com/AzenAnn/DSA-Mastery.git",
    [ValidateSet("auto", "tui", "plain")]
    [string]$Ui,
    [switch]$CheckOnly,
    [switch]$SkipVscode,
    [switch]$InstallVscode,
    [switch]$UpdateRepo,
    [switch]$NonInteractive,
    [switch]$Json,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs
)

# Force UTF-8 output encoding for this console session
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch { }

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LocalSetup = Join-Path $ScriptDir "setup.mjs"
$LocalRepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$BuildToolsId = "Microsoft.VisualStudio.2022.BuildTools"

function Test-AdminRights {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-CommandAvailable {
    param([Parameter(Mandatory = $true)][string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-ProcessPath {
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($machine -or $user) {
        $env:Path = "$machine;$user"
    }
}

function Update-WingetSource {
    if (-not (Test-CommandAvailable "winget")) { return }
    try {
        & winget source update --accept-source-agreements 2>&1 | Out-Null
    } catch {
        Write-Warning "winget source update failed, continuing with cached index"
    }
}

function Install-WingetPackage {
    param(
        [Parameter(Mandatory = $true)][string]$Id,
        [string[]]$ExtraArguments = @(),
        [int]$MaxRetries = 2
    )
    if (-not (Test-CommandAvailable "winget")) {
        throw "winget not found. Please install App Installer from Microsoft Store, then retry."
    }
    Update-WingetSource
    $attempt = 0
    while ($attempt -lt $MaxRetries) {
        $attempt++
        & winget install --id $Id --exact --source winget --accept-source-agreements --accept-package-agreements @ExtraArguments
        if ($LASTEXITCODE -eq 0) {
            Refresh-ProcessPath
            return
        }
        if ($LASTEXITCODE -eq -1978335189) {
            Write-Host "Package already installed ($Id), skipping." -ForegroundColor Yellow
            Refresh-ProcessPath
            return
        }
        Write-Warning "winget install attempt $attempt/$MaxRetries failed for $Id (exit $LASTEXITCODE)"
        if ($attempt -lt $MaxRetries) {
            Update-WingetSource
            Start-Sleep -Seconds 3
        }
    }
    throw "winget install failed after $MaxRetries attempts: $Id (exit $LASTEXITCODE)"
}

function Node-IsReady {
    if (-not (Test-CommandAvailable "node")) { return $false }
    try {
        $version = (& node --version).Trim().TrimStart("v")
        $parsed = [Version]$version
        return $parsed -ge [Version]"22.13.0"
    } catch {
        return $false
    }
}

function Ensure-Node {
    if (Node-IsReady) { return }
    if ($CheckOnly) { throw "check-only: Node.js >= 22.13.0 not satisfied; install skipped." }
    Install-WingetPackage "OpenJS.NodeJS.LTS"
    if (-not (Node-IsReady)) { throw "Node.js install completed but version still < 22.13.0; open a new terminal and retry." }
}

function Ensure-Git {
    if (Test-CommandAvailable "git") { return }
    if ($CheckOnly) { throw "check-only: Git not found; install skipped." }
    Install-WingetPackage "Git.Git"
}

function Test-ValidRepository {
    param([Parameter(Mandatory = $true)][string]$Path)
    return (Test-Path (Join-Path $Path "package.json") -PathType Leaf) -and
        (Test-Path (Join-Path $Path "pnpm-lock.yaml") -PathType Leaf) -and
        (Test-Path (Join-Path $Path "labs") -PathType Container) -and
        (Test-Path (Join-Path $Path "tools\lab\cli.mjs") -PathType Leaf) -and
        (Test-Path (Join-Path $Path "scripts\bootstrap\setup.mjs") -PathType Leaf)
}

# Warn about admin rights (Build Tools / VS Code may need elevation)
if (-not (Test-AdminRights) -and -not $CheckOnly) {
    Write-Host "Note: running without administrator privileges. Some installers (VS Build Tools) may request elevation." -ForegroundColor Yellow
}

if (-not $RepoDir) {
    if (Test-Path $LocalSetup -PathType Leaf) {
        $RepoDir = $LocalRepoRoot
    } else {
        $RepoDir = Join-Path (Get-Location) "DSA-Mastery"
    }
}
$RepoDir = [IO.Path]::GetFullPath($RepoDir)

Ensure-Node
Ensure-Git

if (-not (Test-Path $LocalSetup -PathType Leaf)) {
    if ($CheckOnly) {
        if (-not (Test-ValidRepository $RepoDir)) {
            throw "Running -CheckOnly from outside the repo requires an existing valid repo: $RepoDir"
        }
    } else {
        if (Test-Path $RepoDir) {
            if (-not (Test-ValidRepository $RepoDir)) {
                $entries = @(Get-ChildItem -LiteralPath $RepoDir -Force)
                if ($entries.Count -gt 0) {
                    throw "Target directory is non-empty and not a DSA Mastery repo, will not overwrite: $RepoDir"
                }
            }
        } else {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $RepoDir) | Out-Null
        }
        if (-not (Test-ValidRepository $RepoDir)) {
            & git clone $RepoUrl $RepoDir
            if ($LASTEXITCODE -ne 0) { throw "git clone failed: $RepoUrl" }
        }
    }
}

$SetupPath = if (Test-Path $LocalSetup -PathType Leaf) { $LocalSetup } else { Join-Path $RepoDir "scripts\bootstrap\setup.mjs" }
if (-not (Test-Path $SetupPath -PathType Leaf)) { throw "Cannot find DSA Mastery setup.mjs: $SetupPath" }

$Forwarded = @()
if ($Profile) { $Forwarded += @("--profile", $Profile) }
if ($RepoUrl) { $Forwarded += @("--repo-url", $RepoUrl) }
if ($CheckOnly) { $Forwarded += "--check-only" }
if ($SkipVscode) { $Forwarded += "--skip-vscode" }
if ($InstallVscode) { $Forwarded += "--install-vscode" }
if ($UpdateRepo) { $Forwarded += "--update-repo" }
if ($NonInteractive) { $Forwarded += "--non-interactive" }
if ($Json) { $Forwarded += "--json" }
if ($Ui) { $Forwarded += @("--ui", $Ui) }
if ($RemainingArgs) { $Forwarded += $RemainingArgs }
$Forwarded += @("--repo-dir", $RepoDir)

& node $SetupPath @Forwarded
exit $LASTEXITCODE
