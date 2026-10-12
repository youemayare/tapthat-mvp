@echo off
setlocal enabledelayedexpansion
title Tayz - Local Development Environment
cd /d "%~dp0"
cls

echo =====================================================================
echo           TAYZ SMART BUSINESS CARDS - LOCAL ENVIRONMENT
echo =====================================================================
echo.
echo  [+] Project Directory:    %~dp0
echo  [+] Main App URL:         http://localhost:3000
echo  [+] Hardware Admin:       http://localhost:3000/admin/login
echo.
echo  -------------------------------------------------------------------
echo  ADMIN CREDENTIALS (Default):
echo  -------------------------------------------------------------------
echo   * Email:                 admin@tayz.app
echo   * Password:              TayzAdmin2026!SecureKey
echo   * 2FA Verification Code: Printed in the "Tayz Server Console" window
echo.
echo  -------------------------------------------------------------------
echo  BATCH INGESTION CLI:
echo  -------------------------------------------------------------------
echo   * Single card:   npm run cards:ingest -- --uid=045BD2AA1B1291 --type=metal
echo   * Batch file:    npm run cards:ingest -- --file=cards.csv --type=metal
echo =====================================================================
echo.

echo [*] Launching Next.js development server in a separate window...
start "Tayz Server Console" /D "%~dp0" cmd /k "npm run dev"

echo.
echo [*] Waiting for Next.js to initialize and bind to port 3000...
echo     (Checking connection every second, up to 25 seconds)
echo.

set ATTEMPTS=0
:WAIT_SERVER
set /a ATTEMPTS+=1
timeout /t 1 /nobreak >nul
curl.exe -s -o nul -m 1 http://localhost:3000
if !ERRORLEVEL! EQU 0 goto SERVER_READY

<nul set /p =.
if !ATTEMPTS! GEQ 25 goto SERVER_TIMEOUT
goto WAIT_SERVER

:SERVER_READY
echo.
echo.
echo [OK] Next.js server is LIVE and responding!
echo [*] Opening http://localhost:3000 in your browser...
start http://localhost:3000
goto FINISHED

:SERVER_TIMEOUT
echo.
echo.
echo [!] Server took longer than 25 seconds to respond.
echo     Please check the "Tayz Server Console" window for any compilation logs.
echo     Once you see "Ready", open http://localhost:3000 in your browser.
goto FINISHED

:FINISHED
echo.
echo =====================================================================
echo  TIPS:
echo   - Keep the "Tayz Server Console" window open to see server logs & 2FA codes.
echo   - Hardware Admin portal is at: http://localhost:3000/admin/login
echo =====================================================================
echo.
pause
