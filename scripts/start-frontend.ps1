$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontend = Join-Path $repo 'frontend'
Set-Location $frontend

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js was not found. Install Node.js 20+ and rerun this script.'
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm was not found. Install Node.js 20+ and rerun this script.'
}
if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
    throw 'Frontend dependencies are missing. Run: cd frontend; npm ci'
}

Write-Host 'PowerShare MM frontend: http://127.0.0.1:5173'
Write-Host 'Backend expected at:   http://127.0.0.1:8000'
Write-Host 'Stop: press Ctrl+C in this terminal.'
npm.cmd run dev -- --host 127.0.0.1
