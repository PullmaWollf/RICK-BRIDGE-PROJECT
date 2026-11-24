@echo off
setlocal
title RICK BRIDGE - Upload
color 0B
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\pick-and-upload.ps1"
endlocal
