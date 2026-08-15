$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repo

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw 'Python was not found. Install Python 3.11+ and rerun this script.'
}
python -c "import uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    throw 'uvicorn is not installed. Activate the project environment and run: python -m pip install -r backend/requirements-api-dev.txt'
}

Write-Host 'PowerShare MM backend: http://127.0.0.1:8000'
Write-Host 'OpenAPI docs:          http://127.0.0.1:8000/docs'
Write-Host 'Stop: press Ctrl+C in this terminal.'
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
