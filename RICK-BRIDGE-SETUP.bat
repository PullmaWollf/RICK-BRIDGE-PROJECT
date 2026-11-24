@echo off
setlocal
title RICK BRIDGE - Setup
color 0B
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup.ps1"
endlocal
