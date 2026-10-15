@echo off
title Ceylonica Public Portal Setup
echo ===================================================
echo   Ceylonica Public Portal - Automated Setup
echo ===================================================

:: 1. Backend Dependencies
echo [1/3] Installing Composer dependencies for backend...
cd /d "%~dp0backend"
call "C:\xampp\php\composer.bat" install --prefer-dist --no-interaction

:: 2. Frontend Dependencies
echo [2/3] Installing NPM packages for frontend...
cd /d "%~dp0frontend"
call npm.cmd install --legacy-peer-deps

:: 3. Clear Caches
echo [3/3] Clearing optimization caches...
cd /d "%~dp0backend"
call "C:\xampp\php\php.exe" artisan optimize:clear

echo.
echo ===================================================
echo   Setup Complete! Run start.bat to launch the app.
echo ===================================================
pause
