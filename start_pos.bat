@echo off
title ITHI POORAM - Restaurant Counter POS & KDS
color 0A
cls
echo =========================================================================
echo                  ITHI POORAM (ഇത്തിപ്പൂരം) - VANCHIYOOR
echo                   RESTAURANT COUNTER SYSTEM & KDS SERVER
echo =========================================================================
echo.
echo  Starting local ultra-low-latency POS server on your counter PC...
echo  Local disk database: ./data/restaurant_store.json (100%% persistent)
echo.
cd /d "%~dp0main-billing-admin-app"

if not exist "node_modules" (
    echo Installing dependencies, please wait...
    npm install
)

echo.
echo  -------------------------------------------------------------
echo  POS Terminal URL:     http://localhost:3000/billing
echo  Kitchen Display URL:  http://localhost:3000/kitchen
echo  Dashboard URL:        http://localhost:3000/
echo  -------------------------------------------------------------
echo.

npm run dev
pause
