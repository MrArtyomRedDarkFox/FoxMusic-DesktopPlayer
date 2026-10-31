@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Install Node.js from https://nodejs.org/
  pause
  exit /b 1
)
call npm install
if errorlevel 1 (
  echo Dependency installation failed.
  pause
  exit /b 1
)
call npm run dist:win
if errorlevel 1 (
  echo Build failed. See errors above.
  pause
  exit /b 1
)
echo.
echo Finished. Windows installers are in the release folder.
pause
