@echo off
setlocal
cd /d "%~dp0.."

if not exist "backend\.venv\Scripts\python.exe" (
  echo Run scripts\setup_windows.bat first.
  pause
  exit /b 1
)

start "PASS Backend" cmd /k "cd /d %CD%\backend && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "PASS Frontend" cmd /k "cd /d %CD%\frontend && pnpm dev"

echo PASS is starting.
echo Portal: http://localhost:5173
echo API docs: http://localhost:8000/docs
timeout /t 3 >nul
start http://localhost:5173

