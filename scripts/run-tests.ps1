# Run all automated tests and save output for debugging.
# Usage:
#   . G:\vibe-coding\devkit\scripts\activate-dev.ps1
#   . G:\vibe-coding\devkit\scripts\start-mysql.ps1
#   pnpm test:run

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$resultsDir = Join-Path $root "test-results"
New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $resultsDir "test-run-$timestamp.log"

Write-Host "GymApp Test Run - $timestamp" -ForegroundColor Cyan
Write-Host "Log: $logFile"

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

Log "Step 1: Create test database (if needed)"
pnpm test:db:create 2>&1 | Tee-Object -FilePath $logFile -Append
if ($LASTEXITCODE -ne 0) { Log "WARN: test db create returned $LASTEXITCODE" }

Log "Step 2: Prepare test database (schema + seed)"
pnpm test:db:prepare 2>&1 | Tee-Object -FilePath $logFile -Append
if ($LASTEXITCODE -ne 0) {
    Log "FAILED: test db prepare"
    exit 1
}

Log "Step 3: Unit + API tests"
pnpm test 2>&1 | Tee-Object -FilePath $logFile -Append
$testExit = $LASTEXITCODE

if ($testExit -eq 0) {
    Log "Unit + API tests PASSED"
} else {
    Log "Unit + API tests FAILED (exit $testExit)"
    Write-Host ""
    Write-Host "See log: $logFile" -ForegroundColor Red
    exit $testExit
}

Log "Done. Full log: $logFile"
Write-Host ""
Write-Host "All tests passed." -ForegroundColor Green
