@echo off
setlocal
cd /d "%~dp0.."

echo [PASS] Backend environment setup
cd backend
py -3.11 -m venv .venv 2>nul
if errorlevel 1 py -3.10 -m venv .venv
if errorlevel 1 (
  echo Python 3.10 or 3.11 is required.
  exit /b 1
)

.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo [PASS] Frontend environment setup
cd ..\frontend
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 is required.
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  call corepack enable
  call corepack prepare pnpm@9.15.9 --activate
)

call pnpm install
if errorlevel 1 exit /b 1

echo [PASS] Setup completed.
pause

