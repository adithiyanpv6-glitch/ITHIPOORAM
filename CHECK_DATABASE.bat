@echo off
title ITHI POORAM - Database Inspector
color 0B
cls

cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0check_database.ps1"

pause
