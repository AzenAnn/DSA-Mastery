[CmdletBinding()]
param(
    [ValidateSet("basic", "full")]
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

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LocalSetup = Join-Path $ScriptDir "setup.mjs"
$LocalRepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$BuildToolsId = "Microsoft.VisualStudio.2022.BuildTools"

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

function Install-WingetPackage {
    param([Parameter(Mandatory = $true)][string]$Id, [string[]]$ExtraArguments = @())
    if (-not (Test-CommandAvailable "winget")) {
        throw "未找到 winget，无法自动安装 $Id；请按 docs/WINDOWS_STUDENT_SETUP_GUIDE.md 手工安装。"
    }
    & winget install --id $Id --exact --source winget --accept-source-agreements --accept-package-agreements @ExtraArguments
    if ($LASTEXITCODE -ne 0) {
        throw "winget 安装失败：$Id（exit $LASTEXITCODE）"
    }
    Refresh-ProcessPath
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
    if ($CheckOnly) { throw "check-only：Node.js 不满足 >= 22.13.0；未执行安装。" }
    Install-WingetPackage "OpenJS.NodeJS.LTS"
    if (-not (Node-IsReady)) { throw "Node.js 安装后仍未满足 >= 22.13.0；请打开新终端后重试。" }
}

function Ensure-Git {
    if (Test-CommandAvailable "git") { return }
    if ($CheckOnly) { throw "check-only：未找到 Git；未执行安装。" }
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
            throw "从仓库外执行 -CheckOnly 时，必须提供已经存在的有效仓库：$RepoDir"
        }
    } else {
        if (Test-Path $RepoDir) {
            if (-not (Test-ValidRepository $RepoDir)) {
                $entries = @(Get-ChildItem -LiteralPath $RepoDir -Force)
                if ($entries.Count -gt 0) {
                    throw "目标目录不为空且不是 DSA Mastery 仓库，不会覆盖：$RepoDir"
                }
            }
        } else {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $RepoDir) | Out-Null
        }
        if (-not (Test-ValidRepository $RepoDir)) {
            & git clone $RepoUrl $RepoDir
            if ($LASTEXITCODE -ne 0) { throw "git clone 失败：$RepoUrl" }
        }
    }
}

$SetupPath = if (Test-Path $LocalSetup -PathType Leaf) { $LocalSetup } else { Join-Path $RepoDir "scripts\bootstrap\setup.mjs" }
if (-not (Test-Path $SetupPath -PathType Leaf)) { throw "找不到 DSA Mastery setup.mjs：$SetupPath" }

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
