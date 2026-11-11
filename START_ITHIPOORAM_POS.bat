@echo off
title ITHI POORAM (ഇത്തിപ്പൂരം) - Restaurant Counter POS & Mobile QR System
color 0A
cls

cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_pos_system.ps1"

pause
