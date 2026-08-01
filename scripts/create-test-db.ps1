# Creates gymapp_test database for automated tests.
# Usage: . G:\vibe-coding\devkit\scripts\activate-dev.ps1; pnpm test:db:create

$mysql = "G:\vibe-coding\devkit\mysql\bin\mysql.exe"
if (-not (Test-Path $mysql)) {
    Write-Error "MySQL not found at $mysql. Run activate-dev.ps1 first."
    exit 1
}

$sql = @"
CREATE DATABASE IF NOT EXISTS gymapp_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON gymapp_test.* TO 'gymapp'@'localhost';
FLUSH PRIVILEGES;
"@

& $mysql -u root -e $sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database gymapp_test is ready." -ForegroundColor Green
} else {
    Write-Error "Failed to create gymapp_test. Is MySQL running?"
    exit 1
}
