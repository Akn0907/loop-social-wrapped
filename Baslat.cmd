@echo off
cd /d "%~dp0"
set "NODE_EXE="
set "PYTHON_EXE="

where node >nul 2>nul
if not errorlevel 1 set "NODE_EXE=node"
if not defined NODE_EXE for /f "delims=" %%I in ('where python 2^>nul') do if not defined PYTHON_EXE set "PYTHON_EXE=%%I"

start "" "http://127.0.0.1:4173"
if defined NODE_EXE (
  "%NODE_EXE%" server.js
  if errorlevel 1 pause
  exit /b
)
if defined PYTHON_EXE (
  echo Node.js is unavailable. Using Python's local static server.
  "%PYTHON_EXE%" -m http.server 4173 --bind 127.0.0.1
  if errorlevel 1 pause
  exit /b
)
echo Install Node.js or Python to run Loop locally.
pause
