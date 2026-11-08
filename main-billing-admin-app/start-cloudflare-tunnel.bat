@echo off
title Ithi Pooram - Cloudflare Customer Tunnel
color 0B
cls
echo ========================================================
echo       ITHI POORAM - FREE CLOUDFLARE CUSTOMER TUNNEL
echo ========================================================
echo.
echo This script connects your store laptop to the free Cloudflare
echo Tunnel so customers can order via mobile data (4G/5G).
echo.

cd /d "%~dp0"

:: 1. Check if cloudflared.exe exists in directory or PATH
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    if not exist "cloudflared.exe" (
        echo [INFO] Downloading official cloudflared.exe (free from Cloudflare)...
        powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
        if not exist "cloudflared.exe" (
            echo [ERROR] Automatic download failed. Please download cloudflared.exe manually from:
            echo https://github.com/cloudflare/cloudflared/releases
            pause
            exit /b 1
        )
    )
)

set CLOUDFLARED_BIN=cloudflared
if exist "cloudflared.exe" set CLOUDFLARED_BIN=.\cloudflared.exe

echo [INFO] Starting Secure HTTPS Tunnel for Port 3000...
echo [INFO] A public https://*.trycloudflare.com link will appear below.
echo [INFO] Copy that link into your QR codes for customer mobile ordering.
echo.
%CLOUDFLARED_BIN% tunnel --url http://localhost:3000
pause
