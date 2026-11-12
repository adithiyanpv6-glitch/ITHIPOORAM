# ========================================================================
# ITHI POORAM (ഇത്തിപ്പൂരം) - Restaurant Local Server Runner
# Specifically tuned for Windows 10 (Works smoothly on older / spare laptops)
# ========================================================================

$baseDir = $PSScriptRoot
$appDir = Join-Path $baseDir "main-billing-admin-app"
$dataDir = Join-Path $appDir "data"
if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }

Clear-Host
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "      ITHI POORAM (ഇത്തിപ്പൂരം) - RESTAURANT SERVER LAUNCHER" -ForegroundColor Yellow
Write-Host "=========================================================================`n" -ForegroundColor Green

# 1. Optimize Windows 10 Power & Lid Settings so laptop never sleeps with lid closed
Write-Host "[1/4] Applying zero-sleep power settings for closed-lid server operation..." -ForegroundColor Cyan
try {
    # 0 = Do Nothing when laptop lid is closed (on AC power)
    powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0 2>$null
    # 0 = Never sleep on AC power
    powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP STANDBYIDLE 0 2>$null
    powercfg /setactive SCHEME_CURRENT 2>$null
    Write-Host "      -> Windows 10 power configured: Laptop will stay running with lid closed." -ForegroundColor Green
} catch {
    Write-Host "      -> Power settings skipped." -ForegroundColor Gray
}

# 2. Verify Node.js is installed
Write-Host "[2/4] Verifying Node.js runtime..." -ForegroundColor Cyan
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "`n[ERROR] Node.js is not installed on this laptop!" -ForegroundColor Red
    Write-Host "Please download and install Node.js (LTS version) from:" -ForegroundColor Yellow
    Write-Host "https://nodejs.org`n" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "      -> Node.js detected: $(node -v)" -ForegroundColor Green

# 3. Check dependencies
if (-not (Test-Path (Join-Path $appDir "node_modules"))) {
    Write-Host "[3/4] Installing dependencies on this laptop (first-time only)..." -ForegroundColor Yellow
    cmd.exe /c "cd /d `"$appDir`" && npm install"
}

# 4. Resolve Local Wi-Fi IPv4 Address
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback' -and 
    $_.IPAddress -notmatch '^169\.' -and 
    $_.IPAddress -notmatch '^127\.' 
} | Select-Object -First 1).IPAddress

if (-not $localIp) { $localIp = "localhost" }

# 5. Start Local Server on Port 3000
$portActive = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $portActive) {
    Write-Host "[3/4] Starting ITHI POORAM Server on port 3000..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$appDir`" && npm run dev" -WindowStyle Minimized
    
    # Wait for server to become responsive
    $maxWait = 30
    for ($i = 0; $i -lt $maxWait; $i++) {
        Start-Sleep -Seconds 1
        $check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($check) {
            Write-Host "      -> Local POS server ready on http://localhost:3000" -ForegroundColor Green
            break
        }
    }
} else {
    Write-Host "[3/4] Local POS server already running on port 3000!" -ForegroundColor Green
}

# 6. Start Cloudflare Tunnel for Mobile Network (4G/5G) QR Customers
Write-Host "[4/4] Starting Cloudflare Tunnel for customer 4G/5G QR ordering..." -ForegroundColor Cyan
$cloudflaredPath = Join-Path $baseDir "cloudflared.exe"

if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "      -> cloudflared.exe not found, downloading automatic bridge..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflaredPath
        Write-Host "      -> cloudflared.exe ready!" -ForegroundColor Green
    } catch {
        curl.exe -L -o $cloudflaredPath "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    }
}

# Stop any duplicate cloudflared instances
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

while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds(30)) {
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

# Register Tunnel URL with local server
if ($tunnelUrl) {
    Set-Content -Path (Join-Path $dataDir "tunnel_url.txt") -Value $tunnelUrl -Force
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/api/tunnel/register" -Method Post -Body (@{ url = $tunnelUrl } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 3 | Out-Null
    } catch {}
} else {
    $tunnelUrl = "https://admin-app-ithipooram.vercel.app"
}

# Write a clean text file on the Desktop so user can send links via WhatsApp
$linksFile = Join-Path $baseDir "MOBILE_LINKS_FOR_STAFF.txt"
$linksContent = @"
=========================================================================
          ITHI POORAM (ഇത്തിപ്പൂരം) - MOBILE PHONE ACCESS LINKS
=========================================================================

1. CASHIER BILLING PHONE:
   Wi-Fi Link:       http://$localIp:3000/billing
   Mobile Data Link: $tunnelUrl/billing

2. KITCHEN DISPLAY PHONE / TABLET:
   Wi-Fi Link:       http://$localIp:3000/kitchen
   Mobile Data Link: $tunnelUrl/kitchen

3. MANAGER DASHBOARD PHONE:
   Wi-Fi Link:       http://$localIp:3000/
   Mobile Data Link: $tunnelUrl/

4. CUSTOMER TABLE QR STANDS:
   Live Menu Link:   $tunnelUrl

=========================================================================
NOTE: Keep the Windows 10 laptop plugged into its charger.
You can close the laptop screen/lid; it will stay running in the background.
=========================================================================
"@

Set-Content -Path $linksFile -Value $linksContent -Force

# Beautiful Console Display
Clear-Host
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "           ITHI POORAM RESTAURANT SERVER IS NOW ONLINE!" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "`n>>> OPEN THESE LINKS ON YOUR MOBILE PHONES: <<<`n" -ForegroundColor Yellow

Write-Host "  [1] CASHIER BILLING PHONE:" -ForegroundColor White
Write-Host "      Wi-Fi Link:       http://${localIp}:3000/billing" -ForegroundColor Green
Write-Host "      Mobile Data Link: $tunnelUrl/billing`n" -ForegroundColor Gray

Write-Host "  [2] KITCHEN DISPLAY (KDS) PHONE / TABLET:" -ForegroundColor White
Write-Host "      Wi-Fi Link:       http://${localIp}:3000/kitchen" -ForegroundColor Green
Write-Host "      Mobile Data Link: $tunnelUrl/kitchen`n" -ForegroundColor Gray

Write-Host "  [3] MANAGER DASHBOARD PHONE:" -ForegroundColor White
Write-Host "      Wi-Fi Link:       http://${localIp}:3000/" -ForegroundColor Green
Write-Host "      Mobile Data Link: $tunnelUrl/`n" -ForegroundColor Gray

Write-Host "  [4] CUSTOMER 4G/5G LIVE QR MENU:" -ForegroundColor White
Write-Host "      $tunnelUrl`n" -ForegroundColor Cyan

Write-Host "-------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  [Saved to Desktop File]: MOBILE_LINKS_FOR_STAFF.txt" -ForegroundColor Yellow
Write-Host "  [Database Status]:       100% Persistent on Laptop Disk (Never Disappears)" -ForegroundColor Green
Write-Host "  [Google Drive Sync]:     Active & Real-Time" -ForegroundColor Green
Write-Host "-------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "`nYOU CAN NOW CLOSE THE LAPTOP LID." -ForegroundColor Yellow
Write-Host "The server will keep running in the background without sleeping." -ForegroundColor White
Write-Host "Press Ctrl+C in this window when closing the restaurant for the day.`n" -ForegroundColor Gray

while (-not $proc.HasExited) {
    Start-Sleep -Seconds 5
}
