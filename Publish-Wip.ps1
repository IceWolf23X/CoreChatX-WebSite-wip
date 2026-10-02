# Run in the extracted package. No permanent execution-policy change is needed.
$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js 22+ is required. Install with: winget install --id OpenJS.NodeJS.LTS --exact'
    exit 1
}
& node (Join-Path $PSScriptRoot 'tools/publish-wip.mjs')
exit $LASTEXITCODE
