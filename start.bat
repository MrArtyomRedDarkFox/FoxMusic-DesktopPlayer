@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required to run FoxsMusic Desktop.
  echo Download Node.js from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing FoxsMusic Desktop dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
call npm start
if errorlevel 1 pause
