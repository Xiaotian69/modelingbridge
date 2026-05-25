@echo off
REM ASCII only: avoids CMD garbled text on Chinese Windows (GBK).
title ModelingBridge-Backend
cd /d "%~dp0backend"
if not exist "requirements.txt" (
  echo ERROR: requirements.txt not found. Put this BAT in project root next to backend folder.
  pause
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  echo ERROR: python not found. Install Python 3.11+ and check "Add python.exe to PATH".
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo First run: creating venv and installing deps. Wait a few minutes...
  python -m venv .venv
  if errorlevel 1 (
    echo ERROR: venv failed. Try: py -3 -m venv .venv
    pause
    exit /b 1
  )
  call ".venv\Scripts\activate.bat"
  python -m pip install --upgrade pip -q
  pip install -r requirements.txt
  if errorlevel 1 (
    echo ERROR: pip install failed.
    pause
    exit /b 1
  )
)

echo.
echo ========================================
echo Backend: http://127.0.0.1:8000
echo Test:   http://127.0.0.1:8000/api/health
echo Keep this window OPEN. Then run: Start-Frontend.bat
echo ========================================
echo.

".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
