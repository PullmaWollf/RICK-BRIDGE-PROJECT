@echo off
py -3 "%~dp0local\bridge.py" pick
if errorlevel 1 pause
