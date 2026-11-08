@echo off
title Ithi Pooram - Store POS & Management Terminal
color 0A
cls
echo ========================================================
echo       ITHI POORAM POS - RESTAURANT STORE TERMINAL
echo ========================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this laptop!
    echo Please download and install Node.js LTS from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Set directory to script location
cd /d "%~dp0"

:: 3. Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] First time setup detected. Installing dependencies...
    call npm install --omit=dev
    echo [INFO] Building optimized production server...
    call npm run build
)

:: 4. Check if .next build exists
if not exist ".next\" (
    echo [INFO] Building production bundle...
    call npm run build
)

:: 5. Launch Chrome / Edge in Dedicated Full-Screen App Window
echo [INFO] Starting Ithi Pooram POS Counter...
start "" "http://localhost:3000"

:: 6. Run Next.js Server on port 3000
echo [SUCCESS] Server running on http://localhost:3000
echo Keep this window open while the store is open.
echo.
npm run start -- -p 3000
pause
