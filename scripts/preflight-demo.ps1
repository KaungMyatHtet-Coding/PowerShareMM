$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repo

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Python 3.11+ is required.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ is required.' }
if (-not (Test-Path 'frontend/node_modules')) { throw 'Missing frontend dependencies. Run: cd frontend; npm ci' }
python -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) { throw 'Backend dependencies are missing. Run: python -m pip install -r backend/requirements-api-dev.txt' }

Write-Host 'Running backend regression and integration checks...'
python -m pytest backend/tests/ tests/integration -q
if ($LASTEXITCODE -ne 0) { throw 'Preflight tests failed.' }

Write-Host ''
Write-Host 'Preflight passed.'
Write-Host 'Backend: http://127.0.0.1:8000'
Write-Host 'API docs: http://127.0.0.1:8000/docs'
Write-Host 'Frontend: http://127.0.0.1:5173'
Write-Host 'Open two terminals and run scripts/start-backend.ps1 and scripts/start-frontend.ps1.'
Write-Host 'No administrator access, Docker, GPU, or internet connection is required after dependencies are installed.'
