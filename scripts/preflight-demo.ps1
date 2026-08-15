$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$passed = [System.Collections.Generic.List[string]]::new()

function Invoke-Gate {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $false)][string[]]$Arguments = @()
    )

    Write-Host "Running $Name..."
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
    $passed.Add($Name)
}

try {
    Push-Location -LiteralPath $repo
    try {
        if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Python 3.11+ is required.' }
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ is required.' }
        if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm is required.' }
        if (-not (Test-Path -LiteralPath (Join-Path $repo 'frontend/node_modules'))) {
            throw 'Missing frontend dependencies. Run: cd frontend; npm ci'
        }

        Invoke-Gate 'Backend dependency check' 'python' @('-c', 'import fastapi, uvicorn')
        Invoke-Gate 'Backend regression and integration tests (54 expected)' 'python' @('-m', 'pytest', 'backend/tests', 'tests/integration', '-q')

        Push-Location -LiteralPath (Join-Path $repo 'frontend')
        try {
            Invoke-Gate 'Frontend typecheck' 'npm.cmd' @('run', 'typecheck')
            Invoke-Gate 'Frontend lint' 'npm.cmd' @('run', 'lint')
            Invoke-Gate 'Frontend test suite' 'npm.cmd' @('test', '--', '--run')
            Invoke-Gate 'Frontend production build' 'npm.cmd' @('run', 'build')
        } finally {
            Pop-Location
        }

        Write-Host ''
        Write-Host 'Successful gates:'
        $passed | ForEach-Object { Write-Host "- $_" }
        Write-Host ''
        Write-Host 'Preflight passed.'
        Write-Host 'Backend: http://127.0.0.1:8000'
        Write-Host 'API docs: http://127.0.0.1:8000/docs'
        Write-Host 'Frontend: http://127.0.0.1:5173'
        Write-Host 'Open two terminals and run scripts/start-backend.ps1 and scripts/start-frontend.ps1.'
        Write-Host 'No administrator access, Docker, GPU, or internet connection is required after dependencies are installed.'
    } finally {
        Pop-Location
    }
} catch {
    Write-Error "Preflight failed: $($_.Exception.Message)"
    exit 1
}
