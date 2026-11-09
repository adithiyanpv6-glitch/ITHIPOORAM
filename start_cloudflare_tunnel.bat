@echo off
title Ithi Pooram - Cloudflare Public Tunnel
color 0b
echo ==============================================================
echo    ITHI POORAM - CLOUDFLARE PUBLIC TUNNEL (4G/5G READY)
echo ==============================================================
echo.
if exist "%~dp0cloudflared.exe" (
    echo [OK] Cloudflare engine found: %~dp0cloudflared.exe
) else (
    echo [INFO] Downloading cloudflared.exe...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe', '%~dp0cloudflared.exe')"
)
echo.
echo Starting Tunnel to http://localhost:3000 ...
echo Look below for your public URL (https://xxxx.trycloudflare.com)
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:3000
pause
