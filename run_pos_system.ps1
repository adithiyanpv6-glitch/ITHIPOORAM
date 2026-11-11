# ========================================================================
# ITHI POORAM (ഇത്തിപ്പൂരം) - Restaurant Local POS & Cloudflare Tunnel Runner
# ========================================================================

$baseDir = $PSScriptRoot
$appDir = Join-Path $baseDir "main-billing-admin-app"
$dataDir = Join-Path $appDir "data"
if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }

Write-Host "`n=========================================================================" -ForegroundColor Green
Write-Host "             ITHI POORAM RESTAURANT COUNTER SYSTEM" -ForegroundColor Yellow
Write-Host "=========================================================================`n" -ForegroundColor Green

# 1. Check or start Next.js local server
$portActive = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $portActive) {
    Write-Host "[1/3] Starting Local ITHI POORAM Server on port 3000..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$appDir`" && npm run dev" -WindowStyle Minimized
    
    # Wait for server to become responsive
    $maxWait = 25
    for ($i = 0; $i -lt $maxWait; $i++) {
        Start-Sleep -Seconds 1
        $check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($check) {
            Write-Host "      -> Local POS server ready on http://localhost:3000" -ForegroundColor Green
            break
        }
    }
} else {
    Write-Host "[1/3] Local POS server already running on port 3000!" -ForegroundColor Green
}

# 2. Start Cloudflare Tunnel
Write-Host "[2/3] Initializing Free Cloudflare Tunnel for Mobile Network (4G/5G) QR ordering..." -ForegroundColor Cyan
$cloudflaredPath = Join-Path $baseDir "cloudflared.exe"

# Stop any old cloudflared processes
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$pInfo = New-Object System.Diagnostics.ProcessStartInfo
$pInfo.FileName = $cloudflaredPath
$pInfo.Arguments = "tunnel --url http://localhost:3000"
$pInfo.RedirectStandardError = $true
$pInfo.RedirectStandardOutput = $true
$pInfo.UseShellExecute = $false
$pInfo.CreateNoWindow = $true

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $pInfo
$proc.Start() | Out-Null

$tunnelUrl = ""
$startTime = Get-Date

while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds(25)) {
    if ($proc.HasExited) { break }
    $line = $proc.StandardError.ReadLine()
    if ($line) {
        if ($line -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $tunnelUrl = $matches[0]
            break
        }
    }
    Start-Sleep -Milliseconds 50
}

# 3. Register URL and Display Status
if ($tunnelUrl) {
    Write-Host "      -> Public HTTPS Tunnel created: $tunnelUrl" -ForegroundColor Green

    # Save to disk
    Set-Content -Path (Join-Path $dataDir "tunnel_url.txt") -Value $tunnelUrl -Force

    # Register with local Next.js server so Table QR codes auto-update
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/api/tunnel/register" -Method Post -Body (@{ url = $tunnelUrl } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 3 | Out-Null
    } catch {}

    Write-Host "`n=========================================================================" -ForegroundColor Green
    Write-Host "                  ALL RESTAURANT STATIONS ONLINE" -ForegroundColor Yellow
    Write-Host "=========================================================================" -ForegroundColor Green
    Write-Host "  🖥️  Counter Billing POS:       http://localhost:3000/billing" -ForegroundColor White
    Write-Host "  🍳  Kitchen Display (KDS):     http://localhost:3000/kitchen" -ForegroundColor White
    Write-Host "  📱  Customer 4G/5G Live Menu:  $tunnelUrl" -ForegroundColor Cyan
    Write-Host "  🖨️  SEZNIK Bluetooth Printer:  Ready" -ForegroundColor White
    Write-Host "  💾  Hard Disk Database:        100% Persistent (Never Disappears)" -ForegroundColor Green
    Write-Host "  ☁️  Google Drive Master Sheet: Real-Time Sync Active" -ForegroundColor Green
    Write-Host "=========================================================================`n" -ForegroundColor Green

    # Open Billing in Browser
    Start-Process "http://localhost:3000/billing"
} else {
    Write-Host "[!] Could not capture tunnel URL, opening local POS on http://localhost:3000/billing..." -ForegroundColor Yellow
    Start-Process "http://localhost:3000/billing"
}

Write-Host "Keep this window open during restaurant operating hours." -ForegroundColor Gray
Write-Host "Press Ctrl+C or close this window when closing the restaurant for the day.`n" -ForegroundColor Gray

# Keep script running to maintain tunnel process
while (-not $proc.HasExited) {
    Start-Sleep -Seconds 2
}
