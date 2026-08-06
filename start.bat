@echo off
echo ===================================================
echo Starting TapThat Development Environment...
echo ===================================================

echo.
echo Starting Next.js server in a new window...
start cmd /k "npm run dev"

echo.
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Opening TapThat in your default browser...
start http://localhost:3000

echo.
echo Done! You can close this window.
