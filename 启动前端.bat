@echo off
REM ASCII only: avoids CMD garbled text on Chinese Windows (GBK).
title ModelingBridge-Frontend
cd /d "%~dp0frontend"
if not exist "package.json" (
  echo ERROR: package.json not found. Put this BAT in project root next to frontend folder.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo First run: npm install. Wait a few minutes...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo ========================================
echo Frontend dev server starting...
echo Open the URL shown below (usually http://127.0.0.1:5173)
echo Keep BOTH windows open (backend + frontend).
echo ========================================
echo.

call npm run dev
pause
