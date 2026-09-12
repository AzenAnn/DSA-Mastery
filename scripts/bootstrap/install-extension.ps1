[CmdletBinding(DefaultParameterSetName = 'Local')]
param(
    [Parameter(Mandatory = $true, ParameterSetName = 'Local')][string]$VsixPath,
    [Parameter(Mandatory = $true, ParameterSetName = 'Release')][string]$ReleaseTag,
    [Parameter(ParameterSetName = 'Release')][string]$DownloadDir = (Join-Path ([IO.Path]::GetTempPath()) 'dsa-vsix-downloads'),
    [Parameter(ParameterSetName = 'Release')][switch]$DownloadOnly,
    [string]$CodePath,
    [string]$UserDataDir,
    [string]$ExtensionsDir,
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'

function Read-VsixIdentity([string]$File) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($File)
    try {
        $entry = $archive.GetEntry('extension.vsixmanifest')
        if (-not $entry) { throw 'VSIX has no extension.vsixmanifest; download/build it again.' }
        $reader = New-Object IO.StreamReader($entry.Open())
        try { [xml]$manifest = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $identity = $manifest.SelectSingleNode('//*[local-name()="Identity"]')
        if (-not $identity -or $identity.Publisher -ne 'dsa-mastery' -or $identity.Id -ne 'dsa-mastery-labs') {
            throw 'This file is not the dsa-mastery.dsa-mastery-labs extension.'
        }
        return [string]$identity.Version
    } finally { $archive.Dispose() }
}

function Find-CodeCli {
    if ($CodePath) {
        if (-not (Test-Path -LiteralPath $CodePath -PathType Leaf)) { throw "CodePath does not exist: $CodePath" }
        return (Resolve-Path -LiteralPath $CodePath).Path
    }
    foreach ($name in @('code.cmd', 'code')) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command -and $command.Source) { return $command.Source }
    }
    foreach ($base in @($env:LOCALAPPDATA, $env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if (-not $base) { continue }
        foreach ($relative in @('Programs\Microsoft VS Code\bin\code.cmd', 'Microsoft VS Code\bin\code.cmd')) {
            $candidate = Join-Path $base $relative
            if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
        }
    }
    throw 'VS Code CLI not found. Pass -CodePath "C:\path with spaces\Microsoft VS Code\bin\code.cmd", or use Extensions > ... > Install from VSIX in VS Code.'
}

function Read-GithubJson([string]$Endpoint, [hashtable]$Headers) {
    try { return Invoke-RestMethod -Uri ('https://api.github.com/' + $Endpoint) -Headers $Headers }
    catch {
        $gh = Get-Command gh -ErrorAction SilentlyContinue
        if ($gh) {
            $json = & $gh.Source api $Endpoint
            if ($LASTEXITCODE -eq 0) { return ($json | ConvertFrom-Json) }
        }
        throw ('GitHub release metadata unavailable (network, rate limit or authentication). Open https://github.com/AzenAnn/DSA-Mastery/releases and download a public ext-v* asset, then use -VsixPath. ' + $_.Exception.Message)
    }
}

try {
    if ([bool]$UserDataDir -ne [bool]$ExtensionsDir) { throw 'For an isolated profile, specify both -UserDataDir and -ExtensionsDir.' }
    if ($PSCmdlet.ParameterSetName -eq 'Release') {
        if ($CheckOnly) { throw '-CheckOnly requires -VsixPath; it does not download releases.' }
        $api = 'repos/AzenAnn/DSA-Mastery/releases'
        $headers = @{ 'User-Agent' = 'DSA-Mastery-VSIX-Installer'; 'Accept' = 'application/vnd.github+json' }
        if ($ReleaseTag -eq 'latest') {
            $releases = Read-GithubJson ($api + '?per_page=100') $headers
            $release = $releases | Where-Object { -not $_.draft -and $_.tag_name -like 'ext-v*' } | Sort-Object published_at -Descending | Select-Object -First 1
        } else {
            $release = Read-GithubJson ($api + '/tags/' + [uri]::EscapeDataString($ReleaseTag)) $headers
        }
        if (-not $release -or $release.draft) { throw 'No public extension release found. Select an ext-v* release on GitHub or build a local VSIX.' }
        $assets = @($release.assets | Where-Object { $_.name -match '^dsa-mastery-labs-[0-9][a-zA-Z0-9.+-]*\.vsix$' })
        if ($assets.Count -ne 1) { throw 'Release must contain exactly one DSA Mastery VSIX asset. Select a specific release or download through GitHub.' }
        $asset = $assets[0]
        New-Item -ItemType Directory -Path $DownloadDir -Force | Out-Null
        $VsixPath = Join-Path (Resolve-Path -LiteralPath $DownloadDir).Path $asset.name
        $partial = $VsixPath + '.' + [guid]::NewGuid().ToString('N') + '.download'
        Write-Output "Downloading $($release.tag_name): $($asset.browser_download_url)"
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile $partial
            $null = Read-VsixIdentity $partial
            $hash = (Get-FileHash -LiteralPath $partial -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($asset.digest -and $asset.digest -ne ('sha256:' + $hash)) { throw 'Downloaded VSIX digest does not match the release asset. Retry the download.' }
            Move-Item -LiteralPath $partial -Destination $VsixPath -Force
        } finally {
            if (Test-Path -LiteralPath $partial) { Remove-Item -LiteralPath $partial -Force }
        }
    }
    if (-not (Test-Path -LiteralPath $VsixPath -PathType Leaf)) { throw "VSIX does not exist: $VsixPath. Download a release asset or run pnpm run package in tools/vscode-extension first." }
    $VsixPath = (Resolve-Path -LiteralPath $VsixPath).Path
    $version = Read-VsixIdentity $VsixPath
    Write-Output "VSIX: $VsixPath"
    Write-Output "Extension: dsa-mastery.dsa-mastery-labs@$version"
    Write-Output "SHA256: $((Get-FileHash -LiteralPath $VsixPath -Algorithm SHA256).Hash)"
    if ($DownloadOnly) { Write-Output 'Download complete. Install this file through VS Code or rerun with -VsixPath.'; exit 0 }
    $codeCli = Find-CodeCli
    Write-Output "VS Code CLI: $codeCli"
    if ($CheckOnly) { Write-Output 'Checks passed. No extension was installed.'; exit 0 }
    $profileArgs = @()
    if ($UserDataDir) {
        $profileArgs = @('--user-data-dir', [IO.Path]::GetFullPath($UserDataDir), '--extensions-dir', [IO.Path]::GetFullPath($ExtensionsDir))
    }
    & $codeCli @profileArgs --install-extension $VsixPath --force
    if ($LASTEXITCODE -ne 0) { throw "VS Code installation failed (exit $LASTEXITCODE). Check the preceding output and write permission to the chosen user/extensions directories." }
    $installed = & $codeCli @profileArgs --list-extensions --show-versions
    if ($LASTEXITCODE -ne 0 -or -not ($installed -contains "dsa-mastery.dsa-mastery-labs@$version")) { throw 'Installed version could not be verified. Open Extensions and inspect DSA Mastery Labs.' }
    Write-Output "Verified installed version: dsa-mastery.dsa-mastery-labs@$version"
    Write-Output 'In VS Code, run Developer: Reload Window if prompted, then open the repository root. Existing progress in the same user-data directory is retained.'
} catch {
    [Console]::Error.WriteLine('Installation stopped: ' + $_.Exception.Message)
    [Console]::Error.WriteLine('GUI fallback: VS Code > Extensions > ... > Install from VSIX. Do not change permanent execution policy or use administrator mode just to install this extension.')
    exit 1
}
