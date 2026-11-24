@echo off
where codex >nul 2>&1 || (echo Instale o Codex CLI e faca login primeiro. & pause & exit /b 1)
py -3 --version || (echo Instale Python 3.10 ou superior. & pause & exit /b 1)
call codex mcp add rick-bridge -- py -3 "%~dp0local\bridge.py" serve
if errorlevel 1 (echo Falha no registro. Confira codex mcp list. & pause & exit /b 1)
call codex mcp list
pause
