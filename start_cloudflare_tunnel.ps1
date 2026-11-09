# ==============================================================================
# ITHI POORAM - CLOUDFLARE TUNNEL ONE-CLICK LAUNCHER
# Exposes http://localhost:3000 to public HTTPS for customer QR mobile ordering
# Works on all 4G / 5G mobile networks without store WiFi or router port-forwarding!
# ==============================================================================

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   ITHI POORAM - CLOUDFLARE TUNNEL (CUSTOMER QR READY)    " -ForegroundColor Yellow
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
        Write-Host "Alternative: Your live Vercel URL https://admin-app-ithipooram.vercel.app is already active worldwide on all mobile networks!" -ForegroundColor Yellow
        pause
        exit
    }
}

# 2. Check if local POS server is running on port 3000
Write-Host "[2/3] Checking local Next.js server on port 3000..." -ForegroundColor Green
$tcp = Test-NetConnection -ComputerName "localhost" -Port 3000 -InformationLevel Quiet
if (-not $tcp) {
    Write-Host "⚠️ Warning: Port 3000 not responding. Make sure to run 'npm run dev' or 'npm run start' in another terminal." -ForegroundColor Yellow
}

# 3. Launch the Cloudflare Quick Tunnel
Write-Host "[3/3] Starting Cloudflare Tunnel pointing to http://localhost:3000 ..." -ForegroundColor Cyan
Write-Host "Look below for your public HTTPS URL (e.g. https://xxxx.trycloudflare.com)" -ForegroundColor Yellow
Write-Host "Copy that URL and paste it in Table Management > Configure Tunnel URL!" -ForegroundColor Green
Write-Host ""

& $binPath tunnel --url http://localhost:3000
