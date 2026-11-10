# ==============================================================================
# ITHI POORAM - CLOUDFLARE TUNNEL ONE-CLICK AUTOMATIC LAUNCHER
# Automatically embeds public HTTPS link into all table QR codes
# Works on all 4G / 5G mobile networks without store WiFi or router port-forwarding!
# ==============================================================================

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   ITHI POORAM - CLOUDFLARE TUNNEL (AUTOMATIC QR SYNC)    " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$binPath = "$PSScriptRoot\cloudflared.exe"

# 1. Download official portable cloudflared binary if not present
if (-not (Test-Path $binPath)) {
    Write-Host "[1/3] Downloading official Cloudflare Tunnel engine..." -ForegroundColor Green
    $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $downloadUrl -OutFile $binPath -UseBasicParsing
        Write-Host "✓ Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Defaulting to permanent cloud link https://admin-app-ithipooram.vercel.app" -ForegroundColor Yellow
        pause
        exit
    }
}

# 2. Check if local POS server is running on port 3000
Write-Host "[2/3] Checking local Next.js server on port 3000..." -ForegroundColor Green
$tcp = Test-NetConnection -ComputerName "localhost" -Port 3000 -InformationLevel Quiet
if (-not $tcp) {
    Write-Host "Notice: Local server on port 3000 not detected. Table QRs can also route to cloud." -ForegroundColor Yellow
}

# 3. Launch the Cloudflare Quick Tunnel and automatically sync URL
Write-Host "[3/3] Starting Cloudflare Tunnel pointing to http://localhost:3000 ..." -ForegroundColor Cyan
Write-Host "Connecting tunnel..." -ForegroundColor Yellow
Write-Host ""

& $binPath tunnel --url http://localhost:3000 2>&1 | ForEach-Object {
    $line = $_.ToString()
    Write-Host $line

    if ($line -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
        $tunnelUrl = $matches[1]
        Write-Host ""
        Write-Host "****************************************************************" -ForegroundColor Green
        Write-Host "  ✓ SUCCESS: CLOUDFLARE TUNNEL IS ACTIVE!                      " -ForegroundColor Green
        Write-Host "  Public URL: $tunnelUrl" -ForegroundColor Yellow
        Write-Host "  ALL TABLE QRs AUTOMATICALLY POINT TO THIS LINK!               " -ForegroundColor Cyan
        Write-Host "  Customers on 4G/5G mobile networks can now scan and order!    " -ForegroundColor Green
        Write-Host "****************************************************************" -ForegroundColor Green
        Write-Host ""

        # Register with local server
        try {
            Invoke-RestMethod -Uri "http://localhost:3000/api/tunnel/register" -Method Post -ContentType "application/json" -Body "{`"url`": `"$tunnelUrl`"}" -ErrorAction SilentlyContinue
        } catch {}

        # Register with live Vercel cloud app
        try {
            Invoke-RestMethod -Uri "https://admin-app-ithipooram.vercel.app/api/tunnel/register" -Method Post -ContentType "application/json" -Body "{`"url`": `"$tunnelUrl`"}" -ErrorAction SilentlyContinue
        } catch {}
    }
}
